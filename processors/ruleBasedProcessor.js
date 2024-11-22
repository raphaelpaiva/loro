const Processor = require('./processor').Processor;
const path = require('path');
const fs = require('fs');

const IMG_TOKEN = '!image';

const DEFAULT_CONFIG = {
  rule_processor: {
    queueUrl:     "amqp://queue:5672",
    wakeOnLanMAC: undefined,
    backendUrl:   "http://whisper:8080/inference"
  }
};

class RuleBased extends Processor {
  constructor() {
    super('zoa');
    this.configPath = path.resolve(__dirname, 'config.json');
    this.config = DEFAULT_CONFIG;

    this.exchange = 'msgex';
    this.outputQueueName = 'send';
    this.rulesFile = path.resolve(__dirname, 'rules', 'rules.js');
    this.rules = [];
    
    if (fs.existsSync(this.configPath)) {
      try {
        const config_file = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.config = {...this.config, ...config_file};
        this.log(`Loaded config file.`);
      } catch(err) {
        this.log(`Error reading configuration. Using defaults. ${e}`);
      }

      this.log(`Using config: ${JSON.stringify(this.config)}`);
      this.queueUrl = this.config.rule_processor.queueUrl;
    }
    

    this.loadRules();
    fs.watchFile(this.rulesFile, (curr, prev) => {
      if (curr.mtimeMs > prev.mtimeMs) {
        this.log(`Reloading ${this.rulesFile}`);
        this.loadRules();
      }
    });
  }

  loadRules() {
    let newRules = undefined;
    try {
      delete require.cache[this.rulesFile];
      newRules = require(this.rulesFile);

      if (!!newRules) {
        this.rules = newRules;
      }

      this.log(`Loaded ${this.rules.length} rules:`);
      this.logRules();
    } catch(error) {
      this.log(`Could not load rules: ${error}`);
      this.log(`Rules not reloaded. Current rules are still in place:`);
      this.logRules();
    }

  }

  logRules() {
    this.rules.forEach(element => {
      this.log(`  - ${element.name}`);
    });
  }

  async bind() {
    await this.channel.assertExchange(this.exchange, 'topic', {durable: true});
    await this.channel.bindQueue(this.queueName, this.exchange, 'msg.#');
    await this.channel.assertQueue(this.outputQueueName, {durable: true})
  }

  async consumer(message) {
    if (!message.content) {
      return;
    }
    const zapMsg = JSON.parse(message.content.toString());
    
    if (zapMsg.body?.includes('🦜 Currupaco!')) {
      return;
    }

    try {
      for (const rule of this.rules) {
        const match = this.matches(rule, zapMsg);
        
        if (match.matches) {
          let responseText = await this.fetchResponse(rule.response, match.regexMatch, zapMsg);

          if (!responseText) {
            this.log(`${rule.name} matched ${zapMsg.id}(${zapMsg.body}), but response was ${responseText}. Rejecting.`);
            continue;
          }

          let responseType = 'chat'
          if (responseText.startsWith(IMG_TOKEN)) {
            responseType = 'image';
            responseText = responseText.substring(responseText.indexOf(IMG_TOKEN) + IMG_TOKEN.length);
          }

          this.log(`Rule ${rule.name} matches ${zapMsg.id}(${zapMsg.body})! ${JSON.stringify(match.reason)}; Responding with ${responseText}`);

          const response = {
            to: this.resolveDestination(zapMsg),
            content: responseText,
            reply_to: zapMsg.id,
            type: responseType
          }

          this.channel.sendToQueue(this.outputQueueName, Buffer.from(JSON.stringify(response)), {persistent: true});
          this.channel.ack(message);
          return;
        } else {
          if (!!rule.debug) {
            this.log(`${rule.name} rejects ${zapMsg.id}(${zapMsg.body}). Reason: ${JSON.stringify(match.reason)}`);
          }
        }
      }
      
      this.channel.ack(message);
    } catch (error) {
      this.log(`Error processing ${zapMsg.id}(${zapMsg.body}): ${error}`);
      this.channel.nack(message);
      throw error
    }
  }

  matches(rule, zapMsg) {
    const result = {
      matchesGroup: false,
      matchesSender: false,
      matchesRegex: false
    };

    if (!!rule.groups) {
      result.matchesGroup = !!zapMsg.chatId &&
        rule.groups.includes(zapMsg.chatId);
    } else {
      result.matchesGroup = true;
    }

    if (!!rule.disabledInChats) {
      result.matchesGroup = result.matchesGroup && !rule.disabledInChats.includes(zapMsg.chatId);
    }

    if (!!rule.senders) {
      result.matchesSender = !!zapMsg.from && rule.senders.includes(zapMsg.from);

    } else {
      result.matchesSender = true;
    }

    let regexMatch = null;
    if (!!rule.regex) {
      regexMatch = zapMsg.body?.trim().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').match(rule.regex);
      result.matchesRegex = !!regexMatch;
    }

    return {
      reason: result,
      matches: (result.matchesGroup || result.matchesSender) && result.matchesRegex,
      regexMatch: regexMatch
    }
  }
  
  async fetchResponse(response, regexMatch, zapMsg) {
    if (typeof response === 'string') {
      return response;
    }
    
    if (Array.isArray(response)) {
      return response[Math.floor(Math.random() * response.length)];
    }

    if (typeof response === 'function') {
      return await response(regexMatch, zapMsg, this.config);
    }
  }
}

const zoador = new RuleBased();

try {
  zoador.connect().then(
    () => {zoador.bind(); zoador.register();}
  );
  
} catch (error) {
  zoador.terminate();
}
