'use strict';

const trello = require('../../trello');
const actions = require('../../actions');
const eventTypes = require('../event-types');
const log = require('../../logger')('intake handler: IAA Go');

const createBPAComponents = require('./move-to-iaa-go/create-bpa-components');
const createATCCard = require('./move-to-iaa-go/create-atc-card');

module.exports = function handleIntakeWebhookEvent(e) {
  if (eventTypes(e) === eventTypes.CardMoved && e.action.data.listAfter.name.startsWith('IAA Go')) {
    return createATCCard(e)
      .then(() => createBPAComponents(e))
  } else {
    return Promise.reject(new Error('Not a move to IAA Go'));
  }
};
