'use strict';

const trello = require('../../../trello');
const actions = require('../../../actions');

module.exports = function createChecklists(e) {
  return actions.addIntakeChecklist(e.action.data.card.id);
};
