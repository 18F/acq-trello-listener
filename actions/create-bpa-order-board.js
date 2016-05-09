'use strict';

const trello = require('../trello');

module.exports = function createBoard(name) {
  const meta = {
    name,
    defaultLists: false,
    prefs_permissionLevel: 'private',
    idBoardSource: '5730ea380f2950dd31043f55'
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
