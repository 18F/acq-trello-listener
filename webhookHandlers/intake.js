'use strict';

const iaaGo = require('./intake/move-to-iaa-go')
const resourcing = require('./intake/add-resourcing-label');

module.exports = function executeIntakeHandlers(e) {
  return iaaGo(e)
    .catch(() => resourcing(e))  // only do resourcing if IAA Go rejects
}
