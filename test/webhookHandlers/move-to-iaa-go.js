'use strict';

const tap = require('tap');
const sinon = require('sinon');
const mockRequire = require('mock-require');
require('sinon-as-promised');

process.env.TRELLO_API_KEY = 'trello-api-key';
process.env.TRELLO_API_TOK = 'trello-api-tok';

const sandbox = sinon.sandbox.create();
const addIntakeChecklist = sandbox.stub();
const createATCCard = sandbox.stub();
const createBPAComponents = sandbox.stub();

mockRequire('../../webhookHandlers/intake/move-to-iaa-go/create-checklists-on-intake-card', addIntakeChecklist);
mockRequire('../../webhookHandlers/intake/move-to-iaa-go/create-atc-card', createATCCard);
mockRequire('../../webhookHandlers/intake/move-to-iaa-go/create-bpa-components', createBPAComponents);

const moveToiaaGo = require('../../webhookHandlers/intake/move-to-iaa-go');

// Disable logging to the console.
require('@erdc-itl/simple-logger').setOptions({ console: false });

tap.beforeEach(done => {
  sandbox.reset();
  done();
});
tap.teardown(() => {
  sandbox.restore();
  mockRequire.stopAll();
});

tap.test('webhook handlers - intake: move to IAA Go', t1 => {
  t1.test('event is not a card move', t2 => {
    const trelloEvent = {
      action: {
        type: 'Something'
      }
    };
    moveToiaaGo(trelloEvent)
      .then(() => {
        t2.fail('rejects');
      })
      .catch(e => {
        t2.pass('rejects');
        t2.equal(e.message, 'Not a move to IAA Go', 'returns the expected error');
      })
      .then(t2.done);
  });

  t1.test('event is a card move', t2 => {
    t2.test('move is not into IAA Go list', t3 => {
      const trelloEvent = {
        action: {
          type: 'updateCard',
          data: {
            card: {
              id: 'card-id',
              name: 'test card'
            },
            listBefore: {
              name: 'list-before'
            },
            listAfter: {
              name: 'list-after'
            }
          }
        }
      };
      moveToiaaGo(trelloEvent)
        .then(() => {
          t3.fail('rejects');
        })
        .catch(e => {
          t3.pass('rejects');
          t3.equal(e.message, 'Not a move to IAA Go', 'returns the expected error');
        })
        .then(t3.done);
    });

    t2.test('move is into IAA Go list', t3 => {
      const trelloEvent = {
        action: {
          type: 'updateCard',
          data: {
            card: {
              id: 'card-id',
              name: `card-name`
            },
            listBefore: {
              name: 'list-before'
            },
            listAfter: {
              name: 'IAA Go'
            }
          }
        }
      };

      t3.test('addIntakeChecklist rejects', t4 => {
        const err = new Error('Test error');
        addIntakeChecklist.rejects(err);

        moveToiaaGo(trelloEvent)
          .then(() => {
            t4.fail('rejects');
          })
          .catch(e => {
            t4.pass('rejects');
            t4.equal(e, err, 'returns the expected error');
          })
          .then(t4.done);
      });

      t3.test('addIntakeChecklist resolves', t4 => {
        t4.test('createATCCard rejects', t5 => {
          const err = new Error('Test error');
          addIntakeChecklist.resolves();
          createATCCard.rejects(err);

          moveToiaaGo(trelloEvent)
            .then(() => {
              t5.fail('rejects');
            })
            .catch(e => {
              t5.pass('rejects');
              t5.equal(e, err, 'returns the expected error');
            })
            .then(t5.done);
        });

        t4.test('createATCCard resolves', t5 => {
          t5.test('createBPAComponents rejects', t6 => {
            const err = new Error('Test error');
            addIntakeChecklist.resolves();
            createATCCard.resolves();
            createBPAComponents.rejects(err);

            moveToiaaGo(trelloEvent)
              .then(() => {
                t6.fail('rejects');
              })
              .catch(e => {
                t6.pass('rejects');
                t6.equal(e, err, 'returns the expected error');
              })
              .then(t6.done);
          });

          t5.test('createBPAComponents resolves', t6 => {
            addIntakeChecklist.resolves();
            createATCCard.resolves();
            createBPAComponents.resolves();

            moveToiaaGo(trelloEvent)
              .then(() => {
                t6.pass('resolves');
              })
              .catch(() => {
                t6.fail('resolves');
              })
              .then(t6.done);
          });

          t5.done();
        });

        t4.done();
      });

      t3.done();
    });

    t2.done();
  });

  t1.done();
});
