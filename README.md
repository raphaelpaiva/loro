# loro
Loro is a pet project (pun intended) for a Whatsapp bot.

# Architecture

Loro is basically a queue system. Messages that arrive from whatsapp are put in a message queue to be consumed by processors.

```
                          |-> Processor
Whatsapp |-> Queue server |-> Processor
                          |-> Processor

```

## Whatsapp

The Whatsapp communication code is under the `wpp/` directory. It is both a producer and a consumer. It produces messages to the `pre_process` queue and consumes from the `send` queue.

The communication is currently implemented with the [wpp-connect](https://github.com/wppconnect-team/wppconnect) project.

## Queue server

This is a [rabbitmq](https://www.rabbitmq.com/) server, loro's spine. There are some important components here.

### The pre_process queue

This is the entry point for messages. All messages from Whatsapp will be delivered here.

### The msgex exchange

This is the main exchange for default queue binds, check the [sorter](./processors/sorter.js) processor. This is where processors can bind their custom queues to. Take a look at [rabbitmq exchanges](https://www.rabbitmq.com/tutorials/amqp-concepts#exchanges) for details on how they work.

### Processors

Processors are queue consumers. Their input is a queue from the queue server and their output can be anything.

There are some built-in processors like a [logger](./processors/logger.js), that reads all messages and logs them to a jsonl file.

Processors output can also be a message in a queue. If you put a message in the `send` queue, for example, a message will be sent via the Whatsapp client.

Other interesting built-in processors are the [transcriber](./processors/transcriber.js) and [rule-based processor](./processors/ruleBasedProcessor.js)

All built-in processors are subclasses of [Processor](./processors/processor.js) class, but custom processors don't have to be. They don't even have to be written in javascript. The only requirement is that it connects to the queue server and read from a queue :).

## Running

This project runs on docker-compose, so `docker-compose up` should get you going.

## Connecting to Whatsapp

You need to connect your Whatsapp account so the system can start listening to messages. Run `docker-compose logs -f wpp` for the QR-code.

Support for business API is planned, but with no ETA.

## Connecting to the queue server

You can check rabbitmq dashboard at http://localhost:15672/ and can connect app with it outside the docker ecosystem using `amqp://localhost:25672`. Inside the docker-compose network, connect with `amqp://queue:5672`.

## The Rule based processor
This is a built-in processor that binds to all messages in the `msgex` exchange and tries to match them against a set of rules defined in a special file located in `rules/rules.js`.

The rule output will be sent to the `send` queue to be sent as a reply to the original message.

The rule processor is ran like the example below.
```yaml
rule_processor:
  build:
    context: ./processors
  volumes:
    - ./rules:/app/rules/
  depends_on:
    queue:
      condition: service_healthy
      restart: true
  command: ["node", "ruleBasedProcessor"]  
  restart: unless-stopped
```

Note that it relies on a `rules/` directory mounted on it's working directory.

It will load a `rules/rules.js` file to look for rules.

The `rules.js` file must export a list of rules:

```javascript
module.exports = [
  {
    name: 'Prompt #1',
    regex: /loro+\b/i,
    senders: [''],
    groups: ['xxxxxxxxx-xxxxxxxx@g.us', 'xxxxxxxxx-xxxxxxxx@g.us'],
    response: 'Hello!'
  }
]
```

A rule is an object like the example above with the following properties:

* name(string): the rule name
* regex(regex): the regex to match against message body
* senders(list of string): Restrict this rule to this list of senders. Each item should be a whatsapp user id.
groups(list of string): Restrict this rule to this list of groups. Each item should be a whatsapp group id.
* response(string, list of string or a function): the response to the rule. This can be a string, a list or a function returning a string. If response is a list, the rule processor will pick a random item from the list.