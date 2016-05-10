'use strict';

// require() all the things, so they get included
// in the coverage reports.

process.env.TRELLO_API_KEY = 'trello-api-key';
process.env.TRELLO_API_TOK = 'trello-api-tok';

require('../actions');
require('../webhookHandlers');

require('tap').pass('Coverage initialized');
