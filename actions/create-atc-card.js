'use strict';

const moment = require('moment');
const trello = require('../trello');

module.exports = function createATCCard(cardName, intakeCardURL) {
  if (process.env.TRELLO_ATC_PREFLIGHT_LIST_ID) {
    return trello.post('/1/cards/', {
      name: cardName,
      idList: process.env.TRELLO_ATC_PREFLIGHT_LIST_ID,
      desc: `\n\n---\n* [Intake](${intakeCardURL})`
    });
  } else {
    return Promise.reject(new Error('ATC Preflight list ID not ready'));
  }
};
