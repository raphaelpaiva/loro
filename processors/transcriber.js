const fs      = require('node:fs');
const path    = require('path');
const ffmpeg  = require('fluent-ffmpeg');
const request = require('request');
const mime    = require('mime-types');

const Processor = require('./processor').Processor;

class Transcriber extends Processor {
  constructor() {
    super('transcribe');
    this.tmpPath = path.resolve(__dirname, 'tmp');
    if (!fs.existsSync(this.tmpPath)) {
      this.log(`Creating path ${this.tmpPath}`)
      fs.mkdirSync(this.tmpPath);
    }
  }

  consumer(message) {
    try {
      const zapMsg = JSON.parse(message.content.toString());
      
      const fileExtension    = mime.extension(zapMsg.mimetype);
      const originalFileName = `${zapMsg.id}.${fileExtension}`;
      const originalFilePath = path.resolve(this.tmpPath, originalFileName);

      const outputFileName   = `${originalFileName}.wav`;
      const outputFilePath   = path.resolve(this.tmpPath, outputFileName);

      const transcriber = this;
      
      if(!!zapMsg.fileBase64Buffer) {
        try {
          this.log(`Transcribing ${zapMsg.id}`);
          const buf = this.parseBuffer(zapMsg);
          fs.writeFileSync(originalFilePath, buf);
          console.log(`Converting ${originalFilePath} to ${outputFilePath}`);
          ffmpeg().input(originalFilePath)
            .audioChannels(1)
            .withAudioFrequency(16000)
            .output(outputFilePath)
            .on('end', () => {
              console.log(`ffmpeg wrote ${outputFilePath}`);
              
              const readStream = fs.createReadStream(outputFilePath);
              
              const req = request.post('http://whisper:8099/inference', function (err, resp, body) {
                if (err) {
                  console.log('Error!', err);
                } else {
                  const transcript = JSON.parse(body);
                  transcriber.sendTranscript(message, zapMsg, transcript);
                  fs.rm(originalFilePath, () => {});
                  fs.rm(outputFilePath, () => {});
                  console.log('URL: ', transcript);
                }
              });
  
  
              const form = req.form();
              form.append('file', readStream);
              form.append("temperature", "0.0");
              form.append("temperature_inc", "0.2");
              form.append("response_format", "json");
            })
            .on('error', (err) => {
              transcriber.log(`Error converting ${zapMsg.id}: ${err}`);
              if (err.toString().includes('Invalid data found when processing input')) {
                transcriber.log(`Dropping message ${zapMsg.id} due to unrecoverable error.`);
                transcriber.channel.ack(message);
              }
            })
            .run();
        } catch (error) {
          this.log(`Error transcribing ${zapMsg.id}: ${error}`);
        }
      } else {
        this.log(`Rejecting message ${zapMsg.id}. Reason: fileBase64Buffer is not set.`);
        this.channel.ack(message);
      }
    } catch(err) {
      this.log(`Error transcribing message: ${err}`);
      this.channel.nack(message);
    }
  }
  
  parseBuffer(zapMsg) {
    const target = ';base64';
    const targetIndex = zapMsg.fileBase64Buffer.indexOf(target);
    const skipLength = targetIndex > 0 ? targetIndex + target.length : 0;

    const data = zapMsg.fileBase64Buffer.substring(skipLength);
    return Buffer.from(data, 'base64');
  }

  async sendTranscript(message, zapMsg, transcript) {
    this.reply({
      to: this.resolveDestination(zapMsg),
      content: this.createResponseText(transcript.text),
      reply_to: zapMsg.id
    });

    this.channel.ack(message);
  }

  createResponseText(s) {
    let lines = s.split('\n');
  
    let result = [];
    lines.forEach(line => {
      line = line.trim();
      if (line.length > 0) {
        result.push(`_${line.trim()}_`);
      }
    });
  
    return '*Transcrição do Áudio:*\n"' + result.join('\n') + '"'
  }
}

const transcriber = new Transcriber();
try {
  transcriber.connect().then(
    () => transcriber.register()
  );
  
} catch (error) {
  transcriber.terminate();
}
