// Supports ES6
// import { create, Whatsapp } from 'venom-bot';
const venom = require('venom-bot');
const fs = require('node:fs');
const mime = require('mime-types');

venom
  .create({
    session: 'Loro' //name of session
  })
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  client.onAnyMessage(async (message) => {
    console.log("onAny", message);
    let isMedia = !(Object.keys(message.mediaData).length === 0);
    if (isMedia === true || message.isMMS === true) {
      const buffer = await client.decryptFile(message);
      // At this point you can do whatever you want with the buffer
      // Most likely you want to write it into a file
      const fileName = `media-from-${message.from}-${message.mediaKeyTimestamp}.${mime.extension(message.mimetype)}`;
      await fs.writeFile(fileName, buffer, (err) => {
        if (err) {
          console.error(err);
        } else {
          console.log('Successfully wrote', fileName)
        }
      });
    }
  });
  client.onMessage((message) => {
    console.log(message)
    if (message.body.toLowercase().includes('loro')) {
      client
        .sendText(message.from, '🦜 Currupaco!')
        .then((result) => {
          console.log('Result: ', result); //return object success
        })
        .catch((erro) => {
          console.error('Error when sending: ', erro); //return object error
        });
    }
    if (message.body === 'Hi' && message.isGroupMsg === false) {
      client
        .sendText(message.from, 'Welcome Venom 🕷')
        .then((result) => {
          console.log('Result: ', result); //return object success
        })
        .catch((erro) => {
          console.error('Error when sending: ', erro); //return object error
        });
    }
  });
}
