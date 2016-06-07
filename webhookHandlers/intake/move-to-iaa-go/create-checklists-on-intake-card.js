'use strict';

const actions = require('../../../actions');

module.exports = function createChecklists(e) {
  return actions.addIntakeChecklist(e.action.data.card.id);
};
