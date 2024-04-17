import client, { Channel, Connection, ConsumeMessage } from "amqplib";

export class QueueDispatcher {
  queueURL = 'amqp://queue:5672';
  inputQueue = 'send';
  outputQueue = 'pre_process';
  channel?: Channel;
  connection?: Connection;
  consumer: ((msg: ConsumeMessage | null) => void) | undefined;

  constructor(consumer: (msg: ConsumeMessage | null) => void, queueURL?: string, inputQueue?: string, outputQueue?: string) {
    this.queueURL = queueURL || this.queueURL;
    this.inputQueue = inputQueue || this.inputQueue;
    this.outputQueue = outputQueue || this.outputQueue;
    this.consumer = consumer;

    this.connect();
  }

  private async connect() {
    this.connection = await client.connect(this.queueURL);
    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue(this.outputQueue, {durable: true});
    await this.channel.assertQueue(this.inputQueue, {durable: true});

    if (!!this.consumer) {
      console.log(`Registering ${this.inputQueue} consumer...`);
      this.channel.consume(this.inputQueue, (msg) => {
        try {
          if (!!this.consumer && !!msg) {
            this.consumer(msg);
            this.channel?.ack(msg);
          }
        } catch(err) {
          console.error('Error consuming message: ', err);
          if (!!msg) {
            this.channel?.nack(msg);
          }
        }
      });
    }
  }

  async dispatch(buffer: Buffer) {
    if (!this.channel) {
      await this.connect();
    }

    try {
      if (!!this.channel) {
        this.channel.sendToQueue(this.outputQueue, buffer);
      }
    } catch(err) {
      console.error('Error dispatching (will retry): ', err);
      await this.connect();
      
      if (!!this.channel) {
        this.channel.sendToQueue(this.outputQueue, buffer);
      } else {
        console.log('Could not get Channel for queue', this.outputQueue);
      }
    }
  }

  async terminate() {
    await this.connection?.close();
  }
}
