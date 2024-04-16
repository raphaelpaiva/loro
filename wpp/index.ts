import { create, Message, SocketState, Whatsapp } from '@wppconnect-team/wppconnect';
import { QueueDispatcher } from './QueueDispatcher'
import client, { Connection } from "amqplib";

class WAClient {
  name: string = 'Loro';
  header: string = "🦜 Currupaco!"
  client?: Whatsapp;
  initTimeout: number = 60_000;
  connectionStatusInterval: number = 5_000;
  connectionStatusCount: number = 0;
  dispatcher: QueueDispatcher
  
  constructor() {
    new Array('SIGTERM', 'SIGINT', 'SIGKILL').forEach(signal => {
      process.on(signal, () => {
        console.log(`${signal} received.`);
        this.terminate();
      });
    });

    let initialized = false;
    create({session: this.name, deviceName: this.name, browserArgs: ['--no-sandbox']}).then((client) => {
      initialized = true;
      this.init(client);
    }).catch((error) => console.log(error));

    this.dispatcher = new QueueDispatcher((msg) => this.consumer(msg))
    
    setTimeout(() => {if(!initialized) {throw new Timeout()}}, this.initTimeout);
  }
  consumer(msg: client.ConsumeMessage | null): void {
    if (!!msg) {
      const envelope = JSON.parse(msg.content.toString());
      this.sendMessage(envelope.to, envelope.content, envelope.reply_to)
    }
  }
  
  async terminate() {
    await this.client?.close();
    await this.dispatcher.terminate();
  }

  async init(client: Whatsapp) {
    this.client = client;
    client.onAnyMessage((message) => this.processMessage(message));
    setTimeout(() => this.checkConnectionStatus(), this.connectionStatusInterval);
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
    const identifier = `[${this.name}] (${message.id}) ${message.sender.formattedName}`;
    
    let groupName;
    if (message.isGroupMsg) {
      const chat = await this.client?.getChatById(message.chatId);
      groupName = chat?.name;
    }
    
    const groupIdentifier = !!groupName ? `@${groupName}` : '';
    
    let msgString = '';
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
    }
    setTimeout(() => this.checkConnectionStatus(), this.connectionStatusInterval);
  }

  async dispatch(message: Message | MediaMessage) {
     this.dispatcher.dispatch(Buffer.from(JSON.stringify(message)));
  }

  async sendMessage(destination: string, text: string, msgId?: string) {
    const message = `${this.header}\n${text}`;
    const options = !!msgId ? {quotedMsg: msgId} : {};
    this.client?.sendText(destination, message, options)
                .then((result) => {
                  console.log(`Successfully sent message to ${destination}`);
                })
                .catch((error) => {
                  console.error('Error when sending: ', error);
                });
  }
}

interface MediaMessage extends Message {
  fileBase64Buffer: string;
}

class Timeout extends Error {};

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
