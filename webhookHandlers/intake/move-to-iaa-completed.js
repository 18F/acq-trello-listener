'use strict';

const trello = require('../../trello');
const actions = require('../../actions');
const eventTypes = require('../event-types');
const log = require('../../logger')('intake handler: IAA Completed');

const bpaStartsWith = 'Agile BPA';
const iaaCompleteStartsWith = 'IAA Completed Work Begins';

module.exports = function handleIntakeWebhookEvent(e) {
  return new Promise((resolve, reject) => {
    if (eventTypes(e) === eventTypes.CardMoved) {
      if (e.action.data.card.name.startsWith(bpaStartsWith) && e.action.data.listAfter.name.startsWith(iaaCompleteStartsWith)) {
        // It's possible this card was moved back into the
        // IAA Go list from a later list and already has
        // an associated BPA card and board.  So, we need
        // to check the description.
        trello.get(`/1/cards/${e.action.data.card.id}`, (err, card) => {
          if (err) {
            return reject(err);
          }

          if (!card.desc.match(/(^|\n)\*\*Agile BPA Links\*\*\n\n.*\n\* BPA Dashboard: (http.*?)(\n|$)/)) {
            return reject('Intake BPA does not have an associated BPA Dashboard card');
          }

          bpaCardURL = card.desc.match(/(^|\n)\*\*Agile BPA Links\*\*\n\n.*\n\* BPA Dashboard: (http.*?)(\n|$)/)[2];


        });
      } else {
        reject('Not an Agile  BPA card, or not a move into IAA Go');
      }
    } else {
      reject('Not a card move');
    }
  });
};
