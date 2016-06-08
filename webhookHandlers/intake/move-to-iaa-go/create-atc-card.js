'use strict'

const trello = require('../../../trello');
const actions = require('../../../actions');

module.exports = function createATCCard(e) {
  let intakeCard;
  return trello.get(`/1/cards/${e.action.data.card.id}`)
    .then(card => {
      intakeCard = card;
      if(card.desc.match(/(^|\n)---\n\n\* \[Air Traffic Control\]/)) {
        throw new Error('Intake card already has a link to ATC card');
      }
      return actions.createATCCard(card.name, card.url);
    })
    .then(atcCard => {
      let newDesc = intakeCard.desc;
      if (newDesc) {
        newDesc += '\n\n';
      }
      newDesc += `---\n\n* [Air Traffic Control](${atcCard.url})`;

      return trello.put(`/1/cards/${intakeCard.id}/desc`, { value: newDesc });
    });
}
