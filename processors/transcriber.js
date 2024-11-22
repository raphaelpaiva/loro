const fs      = require('node:fs');
const path    = require('path');
const ffmpeg  = require('fluent-ffmpeg');
const request = require('request');
const mime    = require('mime-types');
const wol     = require('wakeonlan');

const Processor = require('./processor').Processor;

const DEFAULT_CONFIG = {
  transcriber: {
    queueUrl:     "amqp://queue:5672",
    wakeOnLanMAC: undefined,
    backendUrl:   "http://whisper:8080/inference"
  }
};

class Transcriber extends Processor {
  constructor() {
    super('transcribe');
    this.tmpPath    = path.resolve(__dirname, 'tmp');
    this.configPath = path.resolve(__dirname, 'config.json');
    this.config = DEFAULT_CONFIG;
    if (!fs.existsSync(this.tmpPath)) {
      this.log(`Creating path ${this.tmpPath}`)
      fs.mkdirSync(this.tmpPath);
    }

    if (fs.existsSync(this.configPath)) {
      try {
        const config_file = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.config = {...this.config, ...config_file};
        this.log(`Loaded config file.`);
      } catch(err) {
        this.log(`Error reading configuration. Using defaults. ${e}`);
      }

      this.log(`Using config: ${JSON.stringify(this.config)}`);
      this.queueUrl = this.config.transcriber.queueUrl;
    }
  }

  async consumer(message) {
    try {
      const zapMsg = JSON.parse(message.content.toString());
      
      if (this.config?.transcriber?.disabled?.includes(zapMsg.chatId)) {
        this.log(`${zapMsg.chatId} in disabledGroups. Ignoring...`);
        this.channel.ack(message);
        return;
      }

      if (!!this.config.transcriber.wakeOnLanMAC) {
        this.log(`Waking up ${this.config.transcriber.wakeOnLanMAC}`);
        await wol(this.config.transcriber.wakeOnLanMAC);
      }

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
          this.log(`Converting ${originalFilePath} to ${outputFilePath}`);
          ffmpeg().input(originalFilePath)
            .audioChannels(1)
            .withAudioFrequency(16000)
            .output(outputFilePath)
            .on('end', () => {
              this.log(`ffmpeg wrote ${outputFilePath}`);

              const readStream = fs.createReadStream(outputFilePath);
              
              const req = request.post(this.config.transcriber.backendUrl, function (err, resp, body) {
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
  this.log(error);
}
