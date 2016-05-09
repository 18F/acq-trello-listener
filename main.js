'use strict';
require('./env');
const TrelloWebhookServer = require('@18f/trello-webhook-server');
const log = require('./logger')('main');

const intakeListener = new TrelloWebhookServer({
  port: process.env.PORT,
  hostURL: process.env.TRELLO_WEBHOOK_HOST,
  apiKey: process.env.TRELLO_API_KEY,
  apiToken: process.env.TRELLO_API_TOK,
  clientSecret: process.env.TRELLO_CLIENT_SECRET
});

intakeListener.start(process.env.TRELLO_INTAKE_BOARD_ID)
  .then(webhookID => {
    log.info(`Webhook ID: ${webhookID}`);
  })
  .catch(e => {
    log.error(`Error setting up intake webhook listener:`);
    log.error(e);
  });
