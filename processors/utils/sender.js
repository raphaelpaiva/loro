const amqp = require('amqplib');
const readline = require('readline');
const fs = require('fs');
const { randomInt } = require('crypto');

function readLine(filePath, lineNumber) {
  return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
          input: fileStream,
          crlfDelay: Infinity
      });

      let currentLine = 0;
      let myLine = null;

      rl.on('line', line => {
          currentLine++;
          if (currentLine === lineNumber) {
            myLine = line
            rl.close();
          }
      });

      rl.on('close', () => {
        if (myLine < lineNumber) {
          reject(new Error('Requested line is beyond file length.'));
        }
        resolve(myLine);
      });

      rl.on('error', err => {
        reject(err);
      });
  });
}

async function main() {
  const defaultFilePath = 'message-full.log';
  const defaultQueueURL = 'amqp://localhost:25672';
  
  let filePath = defaultFilePath;
  let queueURL = defaultQueueURL
  const linesInFile = 2207;
  let lineNumber = 0;
  if (process.argv.length > 2) {
    lineNumber = parseInt(process.argv[2]);
    filePath = process.argv.length > 3 ? process.argv[3] : defaultFilePath;
    queueURL = process.argv.length > 4 ? process.argv[4] : defaultQueueURL;
  } else {
    lineNumber = randomInt(linesInFile - 1) + 1;
  }

  readLine(filePath, lineNumber)
    .then(async line => {
        if (line === null) {
            console.log(`Line ${lineNumber} does not exist in the file.`);
        } else {
          const connection = await amqp.connect(defaultQueueURL);
          const channel = await connection.createChannel();
          const queue_name = 'pre_process';

          await channel.assertQueue(queue_name, {durable: true});
          channel.sendToQueue(queue_name, Buffer.from(line));

          await channel.close();
          await connection.close();

          console.log(`Sent line #${lineNumber}.`);
        }
    })
    .catch(err => {
        console.error('Error reading file:', err);
    });
}

main();