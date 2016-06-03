'use strict';

const iaaGo = require('./intake/move-to-iaa-go')
const preflight = require('./intake/move-to-iaa-completed');

module.exports = function executeIntakeHandlers(e) {
  return iaaGo(e)
    //.catch(() => preflight(e))  // only do resourcing if IAA Go rejects
}
