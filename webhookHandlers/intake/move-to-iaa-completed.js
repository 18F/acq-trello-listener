'use strict';

const trello = require('../../trello');
const actions = require('../../actions');
const eventTypes = require('../event-types');
const log = require('../../logger')('intake handler: IAA Completed');

const bpaStartsWith = 'Agile BPA';
const iaaCompleteStartsWith = 'IAA Completed Work Begin';

const bpaURLRegex = /(^|\n)### Agile BPA Links\n.*\n\* \[BPA Dashboard\]\((http.*?)\)(\n|$)/;
const bpaCardIDRegex = /https:\/\/trello\.com\/c\/([^\/]+)\/.+/;

module.exports = function handleIntakeWebhookEvent(e) {
  if(eventTypes(e) !== eventTypes.CardMoved) {
    log.verbose('Not a card move');
    return Promise.reject(new Error('Not a card move'));
  }

  if (!e.action.data.card.name.startsWith(bpaStartsWith) || !e.action.data.listAfter.name.startsWith(iaaCompleteStartsWith)) {
    log.verbose(`Not an Agile BPA card, or not a move into ${iaaCompleteStartsWith}`);
    return Promise.reject(new Error(`Not an Agile  BPA card, or not a move into ${iaaCompleteStartsWith}`));
  }

  return trello.get(`/1/cards/${e.action.data.card.id}`) //, (err, card) => {
    .then(card => {
      // Make sure this intake card has an associated BPA Dashboard card
      if (!card.desc.match(bpaURLRegex)) {
        log.info('Intake BPA does not have an associated BPA Dashboard card');
        throw new Error('Intake BPA does not have an associated BPA Dashboard card');
      }

      const bpaCardURL = card.desc.match(bpaURLRegex)[2];
      const bpaCardID = bpaCardURL.match(bpaCardIDRegex)[1];

      log.info(`Intake card '${card.name}' moved to '${iaaCompleteStartsWith}'. Moving associated BPA Dashboard card.`);
      return trello.put(`/1/cards/${bpaCardID}/idList`, { value: process.env.TRELLO_BPA_WORKSHOP_PREP_LIST_ID });
    });
};
