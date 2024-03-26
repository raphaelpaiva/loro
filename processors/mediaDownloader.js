const fs        = require('node:fs');
const path      = require('path');
const mime      = require('mime-types');
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
    
    this.log(`Downloading to ${targetPath}`);
    try {
      if(!!zapMsg.fileBase64Buffer) {
        const buf = Buffer.from(zapMsg.fileBase64Buffer, 'base64');
        fs.writeFileSync(targetPath, buf);
      } else {
        this.log(`Rejecting message ${zapMsg.id}. Reason: fileBase64Buffer is not set.`);
      }
      this.channel.ack(message);
      this.log(`Successfully downloaded ${targetPath}`);
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
