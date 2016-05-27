'use strict';

const iaaGo = require('./intake/iaa-go')

module.exports = function executeIntakeHandlers(e) {
  return iaaGo(e);
}
