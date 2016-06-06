'use strict';

const iaaGo = require('./intake/move-to-iaa-go')

module.exports = function executeIntakeHandlers(e) {
  // Wraps functions in a 0-argument shell and captures
  // the event variable in a closure.  This way the
  // wrapped functions can be passed directly into
  // then/catch.
  const func = fn => (() => fn(e));
  
  const iaaCompleted = func(require('./intake/move-to-iaa-completed'));

  return iaaGo(e)
    .then(iaaCompleted, iaaCompleted)
    .catch(() => null);
}
