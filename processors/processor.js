const amqp = require('amqplib');

const QUEUE_URL = 'amqp://queue:5672';

class Processor {
  constructor(queueName) {
    this.queueName = queueName;
    this.connection = undefined;
    this.channel = undefined;
    // this.connect();
  }

  async connect() {
    if (!this.connection) {
      this.connection = await amqp.connect(QUEUE_URL);
      this.log(`Connected to ${QUEUE_URL}`);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.queueName, {durable: true});
      this.log(`Got queue ${this.queueName}`);
    }
  }

  consumer(message) {} //abstract

  register() {
    this.log('Registering consumer...');
    this.channel.consume(this.queueName, (m) => this.consumer(m));
  }

  log(str) {
    const loggerName = this.constructor.name;
    console.log(`[${loggerName}] ${str}`);
  }
  
  terminate() {
    if (this.connection) {
      this.log('Closing queue connection');
      this.connection.close();
    }
  }
}

exports.Processor = Processor;