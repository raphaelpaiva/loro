// Supports ES6
const venom        = require('venom-bot');
const fs           = require('node:fs');
const path         = require('path');
const express      = require('express');
const amqplib      = require('amqplib');

const queueServerURL = 'amqp://queue:5672'
let queueServerConnection = undefined;
const conf = loadConfig(path.resolve(__dirname, 'loro.json'));
const header = "🦜 Currupaco!"

let global_client = undefined;

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received.');
  if (global_client) {
    try {
      await global_client.close();
    } catch (error) {
      console.error('Error trying to close the client', error);
    }
  }

  if (queueServerConnection) {
    try {
      await queueServerConnection.close();
    } catch (error) {
      console.error('Error trying to close the connection to the queue server', error);
    }
  }
});

const app = express();
createServer();
createClient();
registerConsumer();

async function createClient() {
  venom.create(
    conf.sessionName,
    (base64Qr, asciiQR) => {
      console.log(asciiQR); // Optional to log the QR in the terminal
      var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
        response = {};

      if (matches.length !== 3) {
        return new Error('Invalid input string');
      }
      response.type = matches[1];
      response.data = new Buffer.from(matches[2], 'base64');

      var imageBuffer = response;
      fs.writeFile(
        'out.png',
        imageBuffer['data'],
        'binary',
        function (err) {
          if (err != null) {
            console.log(err);
          }
        }
      );
    },
    (statusSession, session) => {
      console.log(`[${session}] ${statusSession}`);
    },
    {
      executablePath: "/usr/bin/chromium",
      disableSpins: true,
      disableWelcome: true,
      updatesLog: false,
      autoClose: 120000,
    },
    undefined
    )
    .then((client) => start(client))
    .catch((error) => {
      console.error('Error creating client', error);
    });
}

function start(client) {
  global_client = client;
  client.onAnyMessage(async (message) => {
    console.debug('Receiving message');
    if (!message.body?.includes(header)) {
      let isMedia = !(Object.keys(message.mediaData).length === 0);
      
      if (isMedia === true || message.isMMS === true) {
        const buffer = downloadMedia(message, client);
        message.fileBase64Buffer = buffer.toString('base64');
      }

      sendToPreProcessQueue(message);
    }
  });
}

async function downloadMedia(message, client) {
  return await client.decryptFile(message);
}

async function sendReply(client, destination, text, msgId) {
  const message = `${header}\n${text}`;
  client.reply(destination, message, msgId)
        .then((result) => {
          console.log(`Successfully sent message to ${destination}`);
        })
        .catch((error) => {
          console.error('Error when sending: ', error);
        });
}

async function sendMessage(client, destination, text) {
  const message = `${header}\n${text}`;
  client.sendText(destination, message)
        .then((result) => {
          console.log(`Successfully sent message to ${destination}`);
        })
        .catch((error) => {
          console.error('Error when sending: ', error);
        });
}

function loadConfig(filePath) {
  const defaultConf = {
    transcribe: true,
    sessionName: "Loro",
  
    validGroups: [
    ],
  }
  
  console.log(`Loading configuration from ${filePath}`)
  const confFromFile = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // return {...defaultConf, ...confFromFile};
  return Object.assign(defaultConf, confFromFile);
}

function createServer() {
  app.use(express.json());
  const port = 3010;

  app.get('/', (req, resp) => {
    const img_path = path.resolve(__dirname, 'out.png');
    resp.sendFile(img_path);
  });

  app.get('/create', (req, resp) => {
    if (!global_client) {
      const sessionDir = path.resolve(__dirname, 'tokens', conf.sessionName);
      console.log('Removing', sessionDir);
      fs.rmdirSync(sessionDir, {force: true, recursive: true});
      createClient();
      resp.send('Creating');
    } else {
      resp.send('Client already created');
    }
  });


  app.get('/force', async (req, resp) => {
    
    if (!global_client) {
      createClient();
      resp.send('Creating');
    } else {
      await global_client.close();
      await createClient();
      resp.send('Recreating client');
    }
  });

  app.post('/send', (req, resp) => {
    if (!global_client) {
      resp.status(500).send({ message: "Client not initialized." });
      return;
    }

    try {
      let data = req.body;

      if (!data.content || !data.to) {
        resp.status(400).json({ message: "Both 'content' and 'to' fields must be specified." });
        return;
      }

      if (data.reply_to) {
        sendReply(global_client, data.to, data.content, data.reply_to);
      } else {
        sendMessage(global_client, data.to, data.content);
      }
      resp.json({ message: `Sending "${data.content}" to ${data.to}` });
    } catch (err) {
      resp.status(400).json({ message: "Could not decode body: " + err });
    }
  });

  app.get('/status', (req, resp) => {
    if (!!global_client) {
      resp.status(200).json({status: 'Ok'});
    } else {
      resp.status(500).json({status: 'Error'});
    }
  })

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}

async function sendToPreProcessQueue(message) {
  let connection = undefined;
  if (!queueServerConnection) {
    console.log(`Reconnecting to ${queueServerURL}.`);
    connection = await amqplib.connect(queueServerURL);
    queueServerConnection = connection;
  } else {
    connection = queueServerConnection;
  }

  const channel = await connection.createChannel();

  const queueName = 'pre_process';
  await channel.assertQueue(queueName, {durable: true});
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
  await channel.close();
  console.log(`Sent message ${message.id} to ${queueName}`)
}

async function registerConsumer() {
  let connection = undefined;
  if (!queueServerConnection) {
    console.log(`Reconnecting to ${queueServerURL}.`);
    connection = await amqplib.connect(queueServerURL);
    queueServerConnection = connection;
  } else {
    connection = queueServerConnection;
  }

  const channel = await connection.createChannel();

  const queueName = 'send';
  await channel.assertQueue(queueName, {durable: true});
  
  console.log(`Registering ${queueName} consumer...`);
  channel.consume(this.queueName, (msg) => {
    try {
      if (!!global_client) {
        const envelope = JSON.parse(msg.content.toString());
        if (!!envelope.reply_to) {
          sendReply(global_client, envelope.to, envelope.content, envelope.reply_to);
        } else {
          sendMessage(global_client, envelope.to, envelope.content);
        }
        channel.ack(msg);
      } else {
        console.log('Client not initialized');
      }
    } catch (error) {
      console.error(`Error consuming ${queueName}:`, error);
    }
  });
}
