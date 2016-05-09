'use strict';
require('./env');
const TrelloWebhookServer = require('@18f/trello-webhook-server');
const log = require('./logger')('main');
const webhookHandlers = require('./webhookHandlers');

const httpServer = require('http').createServer();

const intakeListener = new TrelloWebhookServer({
  server: httpServer,
  hostURL: process.env.TRELLO_WEBHOOK_HOST,
  apiKey: process.env.TRELLO_API_KEY,
  apiToken: process.env.TRELLO_API_TOK,
  clientSecret: process.env.TRELLO_CLIENT_SECRET
});

httpServer.listen(process.env.PORT, () => {
  intakeListener.start(process.env.TRELLO_INTAKE_BOARD_ID)
    .then(webhookID => {
      log.info(`Intake webhook ID: ${webhookID}`);
      intakeListener.on('data', webhookHandlers.intake);
    })
    .catch(e => {
      log.error(`Error setting up intake webhook listener:`);
      log.error(e);
    });
});
