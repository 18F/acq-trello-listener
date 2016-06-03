'use strict';

const NodeTrello = require('node-trello');
const trello = new NodeTrello(process.env.TRELLO_API_KEY, process.env.TRELLO_API_TOK);

function promisify(fn) {
  const ofn = fn.bind(trello);
  return function(...args) {
    if(args.length && typeof args[args.length - 1] === 'function') {
      ofn(...args);
    } else {
      return new Promise((resolve, reject) => {
        ofn(...args, (err, ...data) => {
          if(err) {
            return reject(err);
          }
          return resolve(...data);
        });
      });
    }
  }
}

module.exports = {
  get: promisify(trello.get),
  put: promisify(trello.put),
  post: promisify(trello.post)
};
