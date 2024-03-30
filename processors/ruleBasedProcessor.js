const Processor = require('./processor').Processor;
const path = require('path');
const fs = require('fs');

class RuleBased extends Processor {
  constructor() {
    super('zoa');
    this.exchange = 'msgex';
    this.outputQueueName = 'send';
    this.rulesFile = path.resolve(__dirname, 'rules', 'rules.js');
    this.rules = [];
    
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
    const zapMsg = JSON.parse(message.content.toString());
    
    try {
      for (const rule of this.rules) {
        const match = this.matches(rule, zapMsg);
        
        if (match.matches) {
          const responseText = await this.fetchResponse(rule.response, match.regexMatch);

          if (!responseText) {
            this.log(`${rule.name} matched ${zapMsg.id}(${zapMsg.body}), but response was ${responseText}. Rejecting.`);
            continue;
          }

          this.log(`Rule ${rule.name} matches ${zapMsg.id}(${zapMsg.body})! Responding with ${responseText}`);
          const response = {
            to: this.resolveDestination(zapMsg),
            content: responseText,
            reply_to: zapMsg.id
          }

          this.channel.sendToQueue(this.outputQueueName, Buffer.from(JSON.stringify(response)), {persistent: true});
          this.channel.ack(message);
          return;
        } else {
          this.log(`${rule.name} rejects ${zapMsg.id}(${zapMsg.body}). Reason: ${JSON.stringify(match.reason)}`);
        }
      }
      
      this.log(`No matches for ${zapMsg.id}(${zapMsg.body}). Discarding.`);
      this.channel.ack(message);
    } catch (error) {
      this.log(`Error processing ${zapMsg.id}(${zapMsg.body}): ${error}`);
      this.channel.nack(message);
    }
  }

  matches(matcher, zapMsg) {
    const result = {
      matchesGroup: false,
      matchesSender: false,
      matchesRegex: false
    };

    if (!!matcher.groups) {
      result.matchesGroup = zapMsg.isGroupMsg &&
        !(Object.keys(zapMsg.groupInfo).length === 0) &&
        matcher.groups.includes(zapMsg.groupInfo.id);
    } else {
      result.matchesGroup = true;
    }

    if (!!matcher.senders) {
      result.matchesSender = !(Object.keys(zapMsg.sender).length === 0) &&
        matcher.senders.includes(zapMsg.sender.id);

    } else {
      result.matchesSender = true;
    }

    let regexMatch = null;
    if (!!matcher.regex) {
      regexMatch = zapMsg.body?.trim().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').match(matcher.regex);
      result.matchesRegex = !!regexMatch;
    }

    return {
      reason: result,
      matches: result.matchesGroup && result.matchesRegex && result.matchesGroup,
      regexMatch: regexMatch
    }
  }
  
  async fetchResponse(response, regexMatch) {
    if (typeof response === 'string') {
      return response;
    }
    
    if (Array.isArray(response)) {
      return response[Math.floor(Math.random() * response.length)];
    }

    if (typeof response === 'function') {
      return await response(regexMatch);
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
