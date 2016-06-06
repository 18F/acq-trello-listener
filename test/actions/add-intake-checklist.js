'use strict';

const tap = require('tap');
const sinon = require('sinon');
require('sinon-as-promised');

process.env.TRELLO_API_KEY = 'trello-api-key';
process.env.TRELLO_API_TOK = 'trello-api-tok';

const trello = require('../../trello');
const sandbox = sinon.sandbox.create();
const trelloGet = sandbox.stub(trello, 'get');
const trelloPost = sandbox.stub(trello, 'post');

const addIntakeChecklist = require('../../actions/add-intake-checklist');
const intakeCardID = 'intake-card-id';

// Disable logging to the console.
require('@erdc-itl/simple-logger').setOptions({ console: false });

tap.test('actions - add intake checklist', t1 => {
  t1.beforeEach(done => {
    sandbox.reset();
    done();
  });

  t1.teardown(() => {
    sandbox.restore();
  });

  t1.test('trello get throws error (fetching existing checklists)', t2 => {
    const err = new Error('Test error');
    trelloGet.rejects(err);

    addIntakeChecklist(intakeCardID)
      .then(() => {
        t2.fail('rejects');
      })
      .catch(e => {
        t2.pass('rejects');
        t2.equals(trelloGet.callCount, 1, 'trello get called one time');
        t2.equals(trelloGet.args[0][0], `/1/cards/${intakeCardID}/checklists`, 'calls the expected URL');
        t2.equals(trelloPost.callCount, 0, 'trello post called 0 times');
        t2.equals(e, err, 'returns the expected error');
      })
      .then(t2.done);
  });

  t1.test('trello get returns a list of checklists include intake forms', t2 => {
    trelloGet.resolves([{ name: 'Intake Forms' }]);

    addIntakeChecklist(intakeCardID)
      .then(() => {
        t2.fail('rejects');
      })
      .catch(e => {
        t2.pass('rejects');
        t2.equals(trelloGet.callCount, 1, 'trello get called one time');
        t2.equals(trelloGet.args[0][0], `/1/cards/${intakeCardID}/checklists`, 'calls the expected URL');
        t2.equals(trelloPost.callCount, 0, 'trello post called 0 times');
        t2.equals(e.message, 'Intake card already has an intake forms checklist', 'returns the expected error');
      })
      .then(t2.done);
  });

  const getPassValues = [
    { name: 'empty list', value: [ ] },
    { name: 'list without intake checklist', value: [{ name: 'Not intake' }] }
  ];

  getPassValues.forEach(getPass => {
    t1.test(`trello get returns ${getPass.name}`, t2 => {
      const expectedChecklistReq = {
        idCard: intakeCardID,
        name: 'Intake Forms'
      };

      t2.test('trello post (create checklist) rejects', t3 => {
        const err = new Error('Test error');
        trelloGet.resolves(getPass.value);
        trelloPost.onCall(0).rejects(err);

        addIntakeChecklist(intakeCardID)
          .then(() => {
            t3.fail('rejects');
          })
          .catch(e => {
            t3.pass('rejects');
            t3.equals(trelloGet.callCount, 1, 'trello get called one time');
            t3.equals(trelloGet.args[0][0], `/1/cards/${intakeCardID}/checklists`, 'calls the expected URL');
            t3.equals(trelloPost.callCount, 1, 'trello post called one time');
            t3.equals(trelloPost.args[0][0], `/1/checklists`, 'calls the expected URL');
            t3.same(trelloPost.args[0][1], expectedChecklistReq, 'sends the expected arguments');
            t3.equals(e, err, 'returns the expected error');
          })
          .then(t3.done);
      });

      t2.test('trello post (create checklist) resolves', t3 => {
        const checklistID = 'checklist-id';

        t3.test('trello post (add first item) rejects', t4 => {
          const err = new Error('Test error');
          trelloGet.resolves(getPass.value);
          trelloPost.onCall(0).resolves({ id: checklistID });
          trelloPost.onCall(1).rejects(err);

          addIntakeChecklist(intakeCardID)
            .then(() => {
              t4.fail('rejects');
            })
            .catch(e => {
              t4.pass('rejects');
              t4.equals(trelloGet.callCount, 1, 'trello get called one time');
              t4.equals(trelloGet.args[0][0], `/1/cards/${intakeCardID}/checklists`, 'calls the expected URL');
              t4.equals(trelloPost.callCount, 2, 'trello post called two times');
              t4.equals(trelloPost.args[0][0], `/1/checklists`, 'calls the expected URL');
              t4.same(trelloPost.args[0][1], expectedChecklistReq, 'sends the expected arguments');
              t4.equals(trelloPost.args[1][0], `/1/checklists/${checklistID}/checkItems`, 'calls the expected URL');
              t4.same(trelloPost.args[1][1], { name: '7600 SOW' }, 'sends the expected arguments');
              t4.equals(e, err, 'returns the expected error');
            })
            .then(t4.done);
        });

        t3.test('trello post (add first item) resolves', t4 => {
          t4.test('trello post (add second item) rejects', t5 => {
            const err = new Error('Test error');
            trelloGet.resolves(getPass.value);
            trelloPost.onCall(0).resolves({ id: checklistID });
            trelloPost.onCall(1).resolves();
            trelloPost.onCall(2).rejects(err);

            addIntakeChecklist(intakeCardID)
              .then(() => {
                t5.fail('rejects');
              })
              .catch(e => {
                t5.pass('rejects');
                t5.equals(trelloGet.callCount, 1, 'trello get called one time');
                t5.equals(trelloGet.args[0][0], `/1/cards/${intakeCardID}/checklists`, 'calls the expected URL');
                t5.equals(trelloPost.callCount, 3, 'trello post called three times');
                t5.equals(trelloPost.args[0][0], `/1/checklists`, 'calls the expected URL');
                t5.same(trelloPost.args[0][1], expectedChecklistReq, 'sends the expected arguments');
                t5.equals(trelloPost.args[1][0], `/1/checklists/${checklistID}/checkItems`, 'calls the expected URL');
                t5.same(trelloPost.args[1][1], { name: '7600 SOW' }, 'sends the expected arguments');
                t5.equals(trelloPost.args[2][0], `/1/checklists/${checklistID}/checkItems`, 'calls the expected URL');
                t5.same(trelloPost.args[2][1], { name: 'Budget Estimate' }, 'sends the expected arguments');
                t5.equals(e, err, 'returns the expected error');
              })
              .then(t5.done);
          });

          t4.test('trello post (add second item) resolves', t5 => {
            const err = new Error('Test error');
            trelloGet.resolves(getPass.value);
            trelloPost.onCall(0).resolves({ id: checklistID });
            trelloPost.onCall(1).resolves();
            trelloPost.onCall(2).resolves();

            addIntakeChecklist(intakeCardID)
              .then(() => {
                t5.pass('resolves');
                t5.equals(trelloGet.callCount, 1, 'trello get called one time');
                t5.equals(trelloGet.args[0][0], `/1/cards/${intakeCardID}/checklists`, 'calls the expected URL');
                t5.equals(trelloPost.callCount, 3, 'trello post called three times');
                t5.equals(trelloPost.args[0][0], `/1/checklists`, 'calls the expected URL');
                t5.same(trelloPost.args[0][1], expectedChecklistReq, 'sends the expected arguments');
                t5.equals(trelloPost.args[1][0], `/1/checklists/${checklistID}/checkItems`, 'calls the expected URL');
                t5.same(trelloPost.args[1][1], { name: '7600 SOW' }, 'sends the expected arguments');
                t5.equals(trelloPost.args[2][0], `/1/checklists/${checklistID}/checkItems`, 'calls the expected URL');
                t5.same(trelloPost.args[2][1], { name: 'Budget Estimate' }, 'sends the expected arguments');
              })
              .catch(e => {
                t5.fail('resolves');
              })
              .then(t5.done);
          });

          t4.done();
        });

        t3.done();
      });

      t2.done();
    });
  });

  t1.done();
});
