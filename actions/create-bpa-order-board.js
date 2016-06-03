'use strict';

const trello = require('../trello');

module.exports = function createBoard(name) {
  const meta = {
    name,
    defaultLists: false,
    prefs_permissionLevel: 'private'
  };

  return trello.post('/1/boards', meta);
};
