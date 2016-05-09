'use strict';

const trello = require('../trello');
const actions = require('../actions');
const eventTypes = require('./event-types');
const log = require('../logger')('intake handler');

module.exports = function handleIntakeWebhookEvent(e) {
  return new Promise((resolve, reject) => {
    if (eventTypes(e) === eventTypes.CardMoved) {
      if (e.action.data.card.name.startsWith('Agile BPA') && e.action.data.listAfter.name.startsWith('IAA Go')) {
        // It's possible this card was moved back into the
        // IAA Go list from a later list and already has
        // an associated BPA card and board.  So, we need
        // to check the description.
        trello.get(`/1/cards/${e.action.data.card.id}`, (err, card) => {
          if(err) {
            return reject(err);
          }

          if(card.desc.match(/(^|\n)\*\*Agile BPA Links\*\*\n/)) {
            return reject('Intake already has links to BPA dashboard and BPA project management board');
          }

          // Now create a board.
          actions.createBPAOrderBoard(card.name)
            .then(boardURL => {
              let newDesc = card.desc;
              if(newDesc) {
                newDesc += '\n\n';
              }
              newDesc += `**Agile BPA Links**\nManagement Board: ${boardURL}`;

              return new Promise((updateResolve, updateReject) => {
                trello.put(`/1/cards/${card.id}/desc`, { value: newDesc }, (descErr, ddd) => {
                  if(descErr) {
                    return updateReject(descErr);
                  }
                  console.log(ddd);
                  return updateResolve();
                });
              });
            })
            .then(() => {
              resolve();
            })
            .catch(e => {
              reject(e);
            });
        });
      }
    }
  });
};
