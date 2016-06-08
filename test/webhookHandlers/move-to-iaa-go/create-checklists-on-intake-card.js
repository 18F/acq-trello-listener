'use strict';

const tap = require('tap');
const sinon = require('sinon');
require('sinon-as-promised');
const mockRequire = require('mock-require');

const sandbox = sinon.sandbox.create();
const addChecklistAction = sandbox.stub();

mockRequire('../../../actions', {
  addIntakeChecklist: addChecklistAction
});

// Disable logging to the console.
require('@erdc-itl/simple-logger').setOptions({ console: false });

const createChecklistHandler = require('../../../webhookHandlers/intake/move-to-iaa-go/create-checklists-on-intake-card');
const trelloEvent = {
  action: { data: { card: { id: 'intake-card-id' }}}
};

tap.test('webhook handlers - intake: move to IAA Go > create checklist on intake card', t1 => {
  tap.beforeEach(done => {
    sandbox.reset();
    done();
  });
  tap.teardown(() => {
    sandbox.restore();
  });

  t1.test('add intake checklist action rejects', t2 => {
    const err = new Error('Test error');
    addChecklistAction.rejects(err);

    createChecklistHandler(trelloEvent)
      .then(() => {
        t2.fail('rejects');
      })
      .catch(e => {
        t2.pass('rejects');
        t2.equal(addChecklistAction.callCount, 1, 'calls add intake checklist action one time');
        t2.equal(addChecklistAction.args[0][0], trelloEvent.action.data.card.id, 'passes the card ID');
        t2.equal(e, err, 'returns the expected error');
      })
      .then(t2.done);
  });

  t1.test('add intake checklist action resolves', t2 => {
    addChecklistAction.resolves();

    createChecklistHandler(trelloEvent)
      .then(() => {
        t2.pass('resolves');
        t2.equal(addChecklistAction.callCount, 1, 'calls add intake checklist action one time');
        t2.equal(addChecklistAction.args[0][0], trelloEvent.action.data.card.id, 'passes the card ID');
      })
      .catch(e => {
        t2.fail('resolves');
      })
      .then(t2.done);
  });

  t1.done();
});
