'use strict';

const iaaGo = require('./intake/move-to-iaa-go')
const iaaCompleted = require('./intake/move-to-iaa-completed');

module.exports = function executeIntakeHandlers(e) {
  const func = fn => (() => fn(e));

  return iaaGo(e)
    .then(func(iaaCompleted), func(iaaCompleted))
    .catch(() => null);
}
