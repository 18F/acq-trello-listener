'use strict';

const iaaGo = require('./intake/move-to-iaa-go')
const iaaCompleted = require('./intake/move-to-iaa-completed')

module.exports = function executeIntakeHandlers(e) {
  // Wraps functions in a 0-argument shell and captures
  // the event variable in a closure.  This way the
  // wrapped functions can be passed directly into
  // then/catch.
  const func = fn => (() => fn(e));

  const iaaCompletedPromise = func(iaaCompleted);

  return iaaGo(e)
    .then(iaaCompletedPromise, iaaCompletedPromise)
    .catch(() => null);
}
