'use strict';

const trello = require('../../trello');
const actions = require('../../actions');
const eventTypes = require('../event-types');
const log = require('../../logger')('intake handler: IAA Go');

const createChecklists = require('./move-to-iaa-go/create-checklists-on-intake-card');
const createATCCard = require('./move-to-iaa-go/create-atc-card');
const createBPAComponents = require('./move-to-iaa-go/create-bpa-components');

module.exports = function handleIntakeWebhookEvent(e) {
  if (eventTypes(e) === eventTypes.CardMoved && e.action.data.listAfter.name.startsWith('IAA Go')) {
    return createChecklists(e)
      .then(() => createATCCard(e))
      .then(() => createBPAComponents(e))
  } else {
    return Promise.reject(new Error('Not a move to IAA Go'));
  }
};
