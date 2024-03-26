const fs   = require('node:fs');
const path = require('path');
const Processor = require('./processor').Processor;

class Logger extends Processor {
  constructor() {
    super('log');
    this.logPath = path.resolve(__dirname, 'log');
    if (!fs.existsSync(this.logPath)) {
      this.log(`Creating path ${this.logPath}`)
      fs.mkdirSync(this.logPath);
    }
  }

  consumer(message) {
    try {
      const logFile = path.resolve(this.logPath, 'message.log');
      const zapMsg = JSON.parse(message.content.toString());
      const messageString = JSON.stringify(zapMsg);
      fs.appendFile(logFile, `\n${messageString}`, function (err) {
        if (err) {
          this.log(`Error writing to message log: ${err}`);
          throw err;
        }
      });
      this.channel.ack(message);
    } catch (error) {
      console.log('Eita', this, error);
    }
  }
}

const logger = new Logger();
try {
  logger.connect().then(
    () => logger.register()
  );
  
} catch (error) {
  logger.terminate();
}
  
process.on('SIGTERM', () => {
  logger.log('SIGTERM signal received.');
  logger.terminate();
});
