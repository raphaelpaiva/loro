const Processor = require('./processor').Processor;

class Sorter extends Processor {
  constructor() {
    super('pre_process');
    this.exchange = 'msgex';
    this.binds = [
      {queue: 'log',        key: 'msg.#'},
      {queue: 'persist',    key: 'msg.#'},
      {queue: 'prompt',     key: 'msg.prompt.#'},
      {queue: 'download',   key: 'msg.#.media'},
      {queue: 'transcribe', key: 'msg.#.transcribe'},
    ];
  }

  async bind() {
    await this.channel.assertExchange(this.exchange, 'topic', {durable: true});

    this.binds.forEach(async (bind) => {
      await this.channel.assertQueue(bind.queue, {durable: true});
      await this.channel.bindQueue(bind.queue, this.exchange, bind.key);
    });
  }

  consumer(message) {
    const zapMsg = JSON.parse(message.content.toString());
    const isPrompt = zapMsg.type === 'chat' &&
                    !!zapMsg.body &&
                    zapMsg.body.toLowerCase().includes('loro');
    const isMedia = Object.keys(zapMsg.mediaData).length > 0;

    const classification = {
      id: zapMsg.id,
      type: zapMsg.type,
      isMedia: isMedia,
      isPrompt: isPrompt,
      body: zapMsg.body
    };

    const label = this.genLabel(classification);
    this.log(`${JSON.stringify(classification)} => ${label}`);

    this.channel.publish(this.exchange, label, message.content, {persistent: true});

    this.channel.ack(message);
  }

  genLabel(classification) {
    let label = "msg"
    label += classification.isPrompt ? ".prompt" : "";
    label += classification.isMedia  ? ".media" : "";
    label += classification.type === 'ptt' ? ".transcribe" : "";
  
    return label;
  }
}

const sorter = new Sorter();
try {
  sorter.connect().then(
    async () => {
      await sorter.bind();
      sorter.register();
    }
  );
} catch (error) {
  sorter.terminate();
}
  
process.on('SIGTERM', () => {
  sorter.log('SIGTERM signal received.');
  sorter.terminate();
});
