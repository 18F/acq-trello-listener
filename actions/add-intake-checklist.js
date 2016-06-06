'use strict';

const trello = require('../trello');

const checklistName = 'Intake Forms';

module.exports = function addIntakeChecklist(cardID) {
  let checklistID;
  return trello.get(`/1/cards/${cardID}/checklists`)
  .then(checklists => {
    if (checklists.some(list => list.name === checklistName)) {
      throw new Error('Intake card already has an intake forms checklist');
    }

    return trello.post('/1/checklists', {
      idCard: cardID,
      name: checklistName
    });
  }).then(checklist => {
    checklistID = checklist.id;
    return trello.post(`/1/checklists/${checklistID}/checkItems`, {
      name: '7600 SOW'
    });
  })
  .then(() => trello.post(`/1/checklists/${checklistID}/checkItems`, { name: 'Budget Estimate' }));
};
