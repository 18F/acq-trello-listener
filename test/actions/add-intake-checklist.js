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

tap.beforeEach(done => {
  sandbox.reset();
  done();
});

tap.teardown(() => {
  sandbox.restore();
});

tap.test('actions - add intake checklist', trelloGetTest => {
  trelloGetTest.test('trello get throws error (fetching existing checklists)', test => {
    const err = new Error('Test error');
    trelloGet.rejects(err);

    addIntakeChecklist(intakeCardID)
      .then(() => {
        test.fail('rejects');
      })
      .catch(e => {
        test.pass('rejects');
        test.equals(trelloGet.callCount, 1, 'trello get called one time');
        test.equals(trelloGet.args[0][0], `/1/cards/${intakeCardID}/checklists`, 'calls the expected URL');
        test.equals(trelloPost.callCount, 0, 'trello post called 0 times');
        test.equals(e, err, 'returns the expected error');
      })
      .then(test.done);
  });

  trelloGetTest.test('trello get returns a list of checklists include intake forms', test => {
    trelloGet.resolves([{ name: 'Intake Forms' }]);

    addIntakeChecklist(intakeCardID)
      .then(() => {
        test.fail('rejects');
      })
      .catch(e => {
        test.pass('rejects');
        test.equals(trelloGet.callCount, 1, 'trello get called one time');
        test.equals(trelloGet.args[0][0], `/1/cards/${intakeCardID}/checklists`, 'calls the expected URL');
        test.equals(trelloPost.callCount, 0, 'trello post called 0 times');
        test.equals(e.message, 'Intake card already has an intake forms checklist', 'returns the expected error');
      })
      .then(test.done);
  });

  const getPassValues = [
    { name: 'empty list', value: [ ] },
    { name: 'list without intake checklist', value: [{ name: 'Not intake' }] }
  ];

  getPassValues.forEach(getPass => {
    trelloGetTest.test(`trello get returns ${getPass.name}`, trelloPostChecklistTest => {
      const expectedChecklistReq = {
        idCard: intakeCardID,
        name: 'Intake Forms'
      };

      trelloPostChecklistTest.test('trello post (create checklist) rejects', test => {
        const err = new Error('Test error');
        trelloGet.resolves(getPass.value);
        trelloPost.onCall(0).rejects(err);

        addIntakeChecklist(intakeCardID)
          .then(() => {
            test.fail('rejects');
          })
          .catch(e => {
            test.pass('rejects');
            test.equals(trelloGet.callCount, 1, 'trello get called one time');
            test.equals(trelloGet.args[0][0], `/1/cards/${intakeCardID}/checklists`, 'calls the expected URL');
            test.equals(trelloPost.callCount, 1, 'trello post called one time');
            test.equals(trelloPost.args[0][0], `/1/checklists`, 'calls the expected URL');
            test.same(trelloPost.args[0][1], expectedChecklistReq, 'sends the expected arguments');
            test.equals(e, err, 'returns the expected error');
          })
          .then(test.done);
      });

      trelloPostChecklistTest.test('trello post (create checklist) resolves', trelloPostFirstCheckItemTest => {
        const checklistID = 'checklist-id';

        trelloPostFirstCheckItemTest.test('trello post (add first item) rejects', test => {
          const err = new Error('Test error');
          trelloGet.resolves(getPass.value);
          trelloPost.onCall(0).resolves({ id: checklistID });
          trelloPost.onCall(1).rejects(err);

          addIntakeChecklist(intakeCardID)
            .then(() => {
              test.fail('rejects');
            })
            .catch(e => {
              test.pass('rejects');
              test.equals(trelloGet.callCount, 1, 'trello get called one time');
              test.equals(trelloGet.args[0][0], `/1/cards/${intakeCardID}/checklists`, 'calls the expected URL');
              test.equals(trelloPost.callCount, 2, 'trello post called two times');
              test.equals(trelloPost.args[0][0], `/1/checklists`, 'calls the expected URL');
              test.same(trelloPost.args[0][1], expectedChecklistReq, 'sends the expected arguments');
              test.equals(trelloPost.args[1][0], `/1/checklists/${checklistID}/checkItems`, 'calls the expected URL');
              test.same(trelloPost.args[1][1], { name: '7600 SOW' }, 'sends the expected arguments');
              test.equals(e, err, 'returns the expected error');
            })
            .then(test.done);
        });

        trelloPostFirstCheckItemTest.test('trello post (add first item) resolves', trelloPostSecondCheckItemTest => {
          trelloPostSecondCheckItemTest.test('trello post (add second item) rejects', test => {
            const err = new Error('Test error');
            trelloGet.resolves(getPass.value);
            trelloPost.onCall(0).resolves({ id: checklistID });
            trelloPost.onCall(1).resolves();
            trelloPost.onCall(2).rejects(err);

            addIntakeChecklist(intakeCardID)
              .then(() => {
                test.fail('rejects');
              })
              .catch(e => {
                test.pass('rejects');
                test.equals(trelloGet.callCount, 1, 'trello get called one time');
                test.equals(trelloGet.args[0][0], `/1/cards/${intakeCardID}/checklists`, 'calls the expected URL');
                test.equals(trelloPost.callCount, 3, 'trello post called three times');
                test.equals(trelloPost.args[0][0], `/1/checklists`, 'calls the expected URL');
                test.same(trelloPost.args[0][1], expectedChecklistReq, 'sends the expected arguments');
                test.equals(trelloPost.args[1][0], `/1/checklists/${checklistID}/checkItems`, 'calls the expected URL');
                test.same(trelloPost.args[1][1], { name: '7600 SOW' }, 'sends the expected arguments');
                test.equals(trelloPost.args[2][0], `/1/checklists/${checklistID}/checkItems`, 'calls the expected URL');
                test.same(trelloPost.args[2][1], { name: 'Budget Estimate' }, 'sends the expected arguments');
                test.equals(e, err, 'returns the expected error');
              })
              .then(test.done);
          });

          trelloPostSecondCheckItemTest.test('trello post (add second item) resolves', test => {
            const err = new Error('Test error');
            trelloGet.resolves(getPass.value);
            trelloPost.onCall(0).resolves({ id: checklistID });
            trelloPost.onCall(1).resolves();
            trelloPost.onCall(2).resolves();

            addIntakeChecklist(intakeCardID)
              .then(() => {
                test.pass('resolves');
                test.equals(trelloGet.callCount, 1, 'trello get called one time');
                test.equals(trelloGet.args[0][0], `/1/cards/${intakeCardID}/checklists`, 'calls the expected URL');
                test.equals(trelloPost.callCount, 3, 'trello post called three times');
                test.equals(trelloPost.args[0][0], `/1/checklists`, 'calls the expected URL');
                test.same(trelloPost.args[0][1], expectedChecklistReq, 'sends the expected arguments');
                test.equals(trelloPost.args[1][0], `/1/checklists/${checklistID}/checkItems`, 'calls the expected URL');
                test.same(trelloPost.args[1][1], { name: '7600 SOW' }, 'sends the expected arguments');
                test.equals(trelloPost.args[2][0], `/1/checklists/${checklistID}/checkItems`, 'calls the expected URL');
                test.same(trelloPost.args[2][1], { name: 'Budget Estimate' }, 'sends the expected arguments');
              })
              .catch(e => {
                test.fail('resolves');
              })
              .then(test.done);
          });

          trelloPostSecondCheckItemTest.done();
        });

        trelloPostFirstCheckItemTest.done();
      });

      trelloPostChecklistTest.done();
    });
  });

  trelloGetTest.done();
});
