'use strict';

const trello = require('../../../trello');
const actions = require('../../../actions');

module.exports = function createBPAComponents(e) {
  if (e.action.data.card.name.startsWith('Agile BPA')) {
    let card;
    let boardURL;
    return trello.get(`/1/cards/${e.action.data.card.id}`)
      .then(intakeCard => {
        // It's possible this card was moved back into the
        // IAA Go list from a later list and already has
        // an associated BPA card and board.  So, we need
        // to check the description.
        if (intakeCard.desc.match(/(^|\n\n)---\n\n### Agile BPA Links\n\n/)) {
          throw new Error('Intake card already has links to BPA dashboard and BPA project management board');
        }
        card = intakeCard;
        return actions.createBPAOrderBoard(card.name);
      })
      .then(board => {
        boardURL = board.url;
        const bits = card.name.match(/Agile BPA\s?(\/|-)([^\/-]*)(\/|-)(.*)/);
        const agency = bits[2].trim();
        const project = bits[4].trim();

        // And then create a BPA dashboard card.
        return actions.createBPAOrderCard(project, agency, '', boardURL);
      })
      .then(bpaCard => {
        let newDesc = card.desc;
        if (newDesc) {
          newDesc += '\n\n';
        }
        newDesc += `---\n\n### Agile BPA Links\n\n* [Management Board](${boardURL})\n* [BPA Dashboard](${bpaCard.url})`;

        return trello.put(`/1/cards/${card.id}/desc`, { value: newDesc });
      });
  } else {
    return Promise.reject('Not an Agile BPA card');
  }
}
