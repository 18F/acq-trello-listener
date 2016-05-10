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
          if (err) {
            return reject(err);
          }

          if (card.desc.match(/(^|\n)\*\*Agile BPA Links\*\*\n\n/)) {
            return reject('Intake already has links to BPA dashboard and BPA project management board');
          }

          let boardURL;
          const bits = card.name.match(/Agile BPA\s?(\/|-)([^\/-]*)(\/|-)(.*)/);
          const agency = bits[2].trim();
          const project = bits[4].trim();

          // Now create a board.
          return actions.createBPAOrderBoard(card.name)
            .then(url => {
              boardURL = url;
              // And then create a BPA dashboard card.
              return actions.createBPAOrderCard(project, agency, '', boardURL);
            })
            .then(bpaCard => {
              let newDesc = card.desc;
              if (newDesc) {
                newDesc += '\n\n';
              }
              newDesc += `**Agile BPA Links**\n\n* Management Board: ${boardURL}\n* BPA Dashboard: ${bpaCard.url}`;

              trello.put(`/1/cards/${card.id}/desc`, { value: newDesc }, descErr => {
                if (descErr) {
                  return reject(descErr);
                }
                return resolve(boardURL);
              });
            })
            .catch(rejection => {
              log.error('Error processing intake card move');
              log.error(rejection);
              reject(rejection);
            });
        });
      } else {
        reject('Not an Agile  BPA card, or not a move into IAA Go');
      }
    } else {
      reject('Not a card move');
    }
  });
};
