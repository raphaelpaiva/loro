const amqp = require('amqplib');

const preprocess_queue = 'pre_process';
const exchange = 'msgex';
let globalConnection = undefined;

async function main() {
  console.log("[Sorter] Simbora");
  const connection = await amqp.connect('amqp://queue:5672');
  globalConnection = connection;
  const channel = await connection.createChannel();

  const binds = [
    {queue: 'log',        key: 'msg.#'},
    {queue: 'persist',    key: 'msg.#'},
    {queue: 'prompt',     key: 'msg.prompt.#'},
    {queue: 'download',   key: 'msg.#.media'},
    {queue: 'transcribe', key: 'msg.#.transcribe'},
  ];

  await channel.assertQueue(preprocess_queue, {durable: true});
  await channel.assertExchange(exchange, 'topic', {durable: true});

  binds.forEach(async (bind) => {
    await channel.assertQueue(bind.queue, {durable: true});
    await channel.bindQueue(bind.queue, exchange, bind.key);
  });

  console.log('[Sorter] Registering consumer');
  channel.consume(preprocess_queue, sortMessages(channel));
}

function sortMessages(channel) {
  return (msg) => {
    const zapMsg = JSON.parse(msg.content.toString());
    const isPrompt = zapMsg.type === 'chat' &&
      !zapMsg.fromMe &&
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

    const label = genLabel(classification);
    console.log('[Sorter]', classification, '=>', label);

    channel.publish(exchange, label, msg.content);

    channel.ack(msg);
  };
}

function genLabel(classification) {
  let label = "msg"
  label += classification.isPrompt ? ".prompt" : "";
  label += classification.isMedia  ? ".media" : "";
  label += classification.type === 'ptt' ? ".transcribe" : "";

  return label;
}

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');

  if (globalConnection) {
    console.log('Closing queue connection');
    globalConnection.close();
  }
});

main();