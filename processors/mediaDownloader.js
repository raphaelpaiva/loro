const fs        = require('node:fs');
const path      = require('path');
const mime      = require('mime-types');
const axios     = require('axios');
const Processor = require('./processor').Processor;

class MediaDownloader extends Processor {
  constructor() {
    super('download');
    this.mediaPath = path.resolve(__dirname, 'media');
    if (!fs.existsSync(this.mediaPath)) {
      console.log(`Creating path ${this.mediaPath}`);
      fs.mkdirSync(this.mediaPath);
    }
  }

  async consumer(message) {
    const zapMsg = JSON.parse(message.content.toString());
    const fileExtension = mime.extension(zapMsg.mimetype);
    const targetFileName = `${zapMsg.id}.${fileExtension}`;
    const targetPath = path.resolve(__dirname, 'media', targetFileName);
    const writer = fs.createWriteStream(targetPath);
    
    this.log(`Downloading to ${targetPath}`);
    try {
      const response = await axios('http://venom-http:3010/media',{
        method: 'POST',
        responseType: 'stream',
        headers: {
          'Content-Type': 'application/json',
        },
        data: zapMsg
      });
      response.data.pipe(writer);
      response.data.on('end', () => {
        this.log(`Successfully downloaded ${targetFileName}`);
        this.channel.ack(message);
      })
      writer.on('error', err => {
        this.log(`Error writing ${targetFileName}: ${err}`);
        this.channel.nack(message);
        writer.close();
      });
    } catch(err) {
      this.log(`Error downloading ${targetFileName}: ${err}`);
      this.channel.nack(message);
    }
  }
}

const downloader = new MediaDownloader();
try {
  downloader.connect().then(
    () => downloader.register()
  );
} catch (error) {
  downloader.terminate();
}
  
process.on('SIGTERM', () => {
  downloader.log('SIGTERM signal received.');
  downloader.terminate();
});
