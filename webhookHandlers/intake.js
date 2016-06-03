'use strict';

const iaaGo = require('./intake/move-to-iaa-go')

module.exports = function executeIntakeHandlers(e) {
  const func = fn => (() => fn(e));

  return iaaGo(e)
    .catch(() => null);
}
