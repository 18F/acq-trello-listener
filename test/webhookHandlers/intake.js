'use strict';

const tap = require('tap');
const sinon = require('sinon');
require('sinon-as-promised');
const mockRequire = require('mock-require');

const sandbox = sinon.sandbox.create();
const iaaGo = sandbox.mock();

mockRequire('../../webhookHandlers/intake/move-to-iaa-go', iaaGo);

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
      })
      .catch(() => {
        test.fail('resolves');
      })
      .then(test.done);
  };

  t1.test('IAA Go handler rejects', t2 => {
    iaaGo.rejects(err);
    actualTest(t2);
  });

  t1.test('IAA Go handler resolves', t2 => {
    iaaGo.resolves();
    actualTest(t2);
  });

  t1.done();
});
