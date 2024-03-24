const amqp = require('amqplib');
const fs   = require('node:fs');
const path = require('path');

const logPath = path.resolve(__dirname, 'log');
const queueName = 'log';
let globalConnection = undefined;

async function main() {
  try {
    if (!fs.existsSync(logPath)) {
      console.log(`[Logger] Creating path ${logPath}`)
      fs.mkdirSync(logPath);
    }
    console.log("[Logger] Simbora");
    const connection = await amqp.connect('amqp://queue:5672');
    globalConnection = connection;
    const channel = await connection.createChannel();
    await channel.assertQueue(queueName, {durable: true});
  
    console.log('[Logger] Registering consumer...');
    channel.consume(queueName, processMessage(channel));
  } catch (error) {
    console.error(`[Logger] ${error}`);
    terminate();
  }
}

function processMessage(channel) {
  return function logMessage(message) {
    try {
      const logFile = path.resolve(logPath, 'message.log');
      const zapMsg = JSON.parse(message.content.toString());
      const messageString = JSON.stringify(zapMsg);
      fs.appendFile(logFile, `\n${messageString}`, function (err) {
        if (err) {
          console.error(`[Logger] Error writing to message log: ${err}`);
          throw err;
        }
      });
      channel.ack(message);
    } catch (error) {
      console.error(`[Logger] ${error}`);
    }
  }
}

process.on('SIGTERM', () => {
  console.info('[Logger] SIGTERM signal received.');
  terminate();
});

main();

function terminate() {
  if (globalConnection) {
    console.log('[Logger] Closing queue connection');
    globalConnection.close();
  }
}
