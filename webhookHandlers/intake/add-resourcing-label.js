'use strict';

const trello = require('../../trello');
const actions = require('../../actions');
const eventTypes = require('../event-types');
const log = require('../../logger')('intake handler: resourcing label');

module.exports = function handleIntakeWebhookEvent(e) {
  return new Promise((resolve, reject) => {
    if (eventTypes(e) === eventTypes.LabelAdded) {
      if(e.action.data.label === 'Resourcing') {
        // create ATC card
      } else {
        reject('Not the Resourcing label');
      }
    } else {
      reject('Not a label added');
    }
  });
};
