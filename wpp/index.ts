import { create, Message, SocketState, Whatsapp } from '@wppconnect-team/wppconnect';
import { QueueDispatcher } from './QueueDispatcher'
import { ConsumeMessage } from "amqplib";

interface Envelope {
  to: string,
  content: string,
  reply_to?: string,
  type?: string
}

interface Config {
  name: string,
  header: string,
  initTimeout: number,
  connectionStatusInterval: number,
  adminChatId?: string,
  startupAdminMessage?: string,
  shutdownAdminMessage?: string
}

interface MediaMessage extends Message {
  fileBase64Buffer: string;
}

class Timeout extends Error {};

const default_config: Config = {
  name: 'Loro',
  header: "🦜 Currupaco!",
  initTimeout: 60_000,
  connectionStatusInterval: 5_000,
  startupAdminMessage: 'Started up! :D',
  shutdownAdminMessage: 'Shutting down! :('
}

class WAClient {
  config: Config = default_config;
  client?: Whatsapp;
  connectionStatusCount: number = 0;
  dispatcher: QueueDispatcher
  
  constructor() {
    new Array('SIGTERM', 'SIGINT').forEach(signal => {
      process.on(signal, () => {
        console.log(`${signal} received.`);
        this.terminate();
      });
    });

    this.config = this.readConfig();

    console.log(`Using config\n${JSON.stringify(this.config, null, 2)}`);

    let initialized = false;
    create({session: this.config.name, deviceName: this.config.name, browserArgs: ['--no-sandbox']}).then((client) => {
      initialized = true;
      this.init(client);
    }).catch((error) => console.log(error));

    this.dispatcher = new QueueDispatcher((msg) => this.consumer(msg))
    
    setTimeout(() => {if(!initialized) {throw new Timeout()}}, this.config.initTimeout);
  }
  consumer(msg: ConsumeMessage | null): void {
    if (!!msg) {
      const envelope: Envelope = JSON.parse(msg.content.toString());
      this.sendMessage(envelope);
    }
  }
  
  async terminate() {
    try { 
      await this.sendAdminMessage(this.config.shutdownAdminMessage);
    } catch(e) {
      console.error('Error sending shutdown message:', e);
    }
    
    try {
      await this.client?.close();
    } catch(e) {
      console.error('Error closing client:', e);
    }
    
    try {
      await this.dispatcher.terminate();
    } catch(e) {
      console.error('Error terminating dispatcher:', e);
    }
  }

  async init(client: Whatsapp) {
    this.client = client;
    client.onAnyMessage((message) => this.processMessage(message));
    setTimeout(() => this.checkConnectionStatus(), this.config.connectionStatusInterval);
  }

  async processMessage(message: Message) {
    const isMedia = message.isMedia || message.isMMS || !!message.mediaData?.type;
    if (isMedia) {
      const base64Media = await this.client?.downloadMedia(message);
      const mediaMessage = { ...message, fileBase64Buffer: base64Media };
      this.dispatch(mediaMessage);
    } else {
      this.dispatch(message);
    }

    this.logMessage(message, isMedia);
  }

  private async logMessage(message: Message, isMedia: boolean) {
    const identifier = `[${this.config.name}] (${message.id}) ${message.sender.formattedName}`;
    
    let groupName;
    if (message.isGroupMsg) {
      const chat = await this.client?.getChatById(message.chatId.toString());
      groupName = chat?.name;
    }
    
    const groupIdentifier = !!groupName ? `@${groupName}` : '';
    
    let msgString: string | undefined = '';
    if (isMedia) {
      msgString = `!Media: ${message.mimetype}`;
    } else {
      msgString = message.body;
    }

    const logMsg = `${identifier}${groupIdentifier}: ${msgString}`;
    console.log(logMsg);
  }

  async checkConnectionStatus() {
    const state = await this.client?.getConnectionState();
    if (state != SocketState.CONNECTED) {
      this.connectionStatusCount++;

      if (this.connectionStatusCount > 5) {
        throw new Timeout;
      }
      console.log(this.connectionStatusCount, state);
      setTimeout(() => this.checkConnectionStatus(), this.config.connectionStatusInterval);
    } else {
      this.sendAdminMessage(this.config.startupAdminMessage);
    }
  }

  async dispatch(message: Message | MediaMessage) {
     this.dispatcher.dispatch(Buffer.from(JSON.stringify(message)));
  }

  async sendMessage(envelope: Envelope) {
    const destination = envelope.to;
    const text = envelope.content;
    const msgId = envelope.reply_to;
    const type = !!envelope.type ? envelope.type : 'chat';
    
    const options = !!msgId ? {quotedMsg: msgId} : {};
    
    if (type == 'chat') {
      const message = `${this.config.header}\n${text}`;
      this.client?.sendText(destination, message, options)
                  .then((result) => console.log(`Successfully sent message to ${destination}`))
                  .catch((error) => console.error('Error when sending: ', error));
    } else if (type == 'image') {
      this.client?.sendImageFromBase64(destination, envelope.content, 'image.jpg', undefined, msgId, false)
                  .then((result) => console.log(`Successfully sent image to ${destination}`))
                  .catch((error) => console.error('Error when sending: ', error));
    }
  }

  async sendAdminMessage(content?: string) {
    if (!!this.config.adminChatId && !!content) {
      this.sendMessage({to: this.config.adminChatId, content: content});
    }
  }

  readConfig(): Config {
    try {
      const config: Config = require('./config.json');

      return {...default_config, ...config}
    } catch(error) {
      console.error('Error reading config file. Using defaults.', error);
      return default_config;
    }
  }
}

function createClient() {
  try {
    new WAClient();
  } catch(error) {
    console.error(error);
    if (!(error instanceof Timeout)) {
      createClient();
    }
  }
}

createClient();
