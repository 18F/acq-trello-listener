'use strict';

const trello = require('../trello');

module.exports = function createBoard(name) {
  const meta = {
    name,
    defaultLists: false,
    prefs_permissionLevel: 'private'
  };

  return new Promise((resolve, reject) => {
    trello.post('/1/boards', meta, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data.url);
    });
  });
};
