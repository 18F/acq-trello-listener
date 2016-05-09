'use strict';

const eventTypes = require('./event-types');
const log = require('../logger')('intake handler');

module.exports = function handleIntakeWebhookEvent(e) {
  if(eventTypes(e) === eventTypes.CardMoved) {
    log.info('Card was moved')
  }
};
