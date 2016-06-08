'use strict';

const tap = require('tap');
const sinon = require('sinon');
require('sinon-as-promised');
const mockRequire = require('mock-require');

const sandbox = sinon.sandbox.create();
const iaaGo = sandbox.mock();
const iaaCompleted = sandbox.mock();

mockRequire('../../webhookHandlers/intake/move-to-iaa-go', iaaGo);
mockRequire('../../webhookHandlers/intake/move-to-iaa-completed', iaaCompleted);

// Disable logging to the console.
require('@erdc-itl/simple-logger').setOptions({ console: false });

const intake = require('../../webhookHandlers/intake');

tap.beforeEach(done => {
  sandbox.reset();
  done();
});
tap.teardown(() => {
  sandbox.restore();
  mockRequire.stopAll();
});

tap.test('webhook handlers - intake', t1 => {
  const err = new Error('Test error');
  const eventObj = { };

  const actualTest = test => {
    intake(eventObj)
      .then(() => {
        test.pass('resolves');
        test.equal(iaaGo.callCount, 1, 'calls IAA Go handler one time');
        test.equal(iaaGo.args[0][0], eventObj, 'passes the event to IAA Go handler');
        test.equal(iaaCompleted.callCount, 1, 'calls IAA Completed handler one time');
        test.equal(iaaCompleted.args[0][0], eventObj, 'passes the event to IAA Completed handler');
      })
      .catch(() => {
        test.fail('resolves');
      })
      .then(test.done);
  };

  t1.test('IAA Go and IAA Completed handlers reject', t2 => {
    iaaGo.rejects(err);
    iaaCompleted.rejects(err);
    actualTest(t2);
  });

  t1.test('IAA Go handler rejects and IAA Completed handler resolves', t2 => {
    iaaGo.rejects(err);
    iaaCompleted.resolves();
    actualTest(t2);
  });

  t1.test('IAA Go handler resolves and IAA Completed handler rejects', t2 => {
    iaaGo.resolves();
    iaaCompleted.rejects(err);
    actualTest(t2);
  });

  t1.test('IAA Go and IAA Completed handlers resolve', t2 => {
    iaaGo.resolves();
    iaaCompleted.resolves();
    actualTest(t2);
  });

  t1.done();
});
