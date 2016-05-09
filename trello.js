'use strict';

const NodeTrello = require('node-trello');
const trello = new NodeTrello(process.env.TRELLO_API_KEY, process.env.TRELLO_API_TOK);

module.exports = trello;
