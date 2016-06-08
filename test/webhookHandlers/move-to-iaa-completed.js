'use strict';

const tap = require('tap');
const sinon = require('sinon');
require('sinon-as-promised');

process.env.TRELLO_API_KEY = 'trello-api-key';
process.env.TRELLO_API_TOK = 'trello-api-tok';
const trello = require('../../trello');

const sandbox = sinon.sandbox.create();
const trelloGet = sandbox.stub(trello, 'get');
const trelloPut = sandbox.stub(trello, 'put');

const moveToiaaCompleted = require('../../webhookHandlers/intake/move-to-iaa-completed');

// Disable logging to the console.
require('@erdc-itl/simple-logger').setOptions({ console: false });

tap.beforeEach(done => {
  sandbox.reset();
  done();
});
tap.teardown(() => {
  sandbox.restore();
});

tap.test('webhook handlers - intake: move to IAA Completed', listIDTest => {
  const err = new Error('Test error');

  listIDTest.test('Workshop prep list ID is not ready', test => {
    delete process.env.TRELLO_BPA_WORKSHOP_PREP_LIST_ID;
    moveToiaaCompleted()
      .then(() => {
        test.fail('rejects');
      })
      .catch(e => {
        test.pass('rejects');
        test.equal(trelloGet.callCount, 0, 'does not call trello get');
        test.equal(trelloPut.callCount, 0, 'does not call trello put');
        test.equal(e.message, 'BPA Workshop Prep list ID not ready', 'returns the expected error');
      })
      .then(test.done);
  });

  listIDTest.test('Workshop prep list ID is ready', eventTest => {
    process.env.TRELLO_BPA_WORKSHOP_PREP_LIST_ID = 'bpa-workshop-prep-list-id';

    eventTest.test('event is not a card move', test => {
      const trelloEvent = {
        action: {
          type: 'Something'
        }
      };
      moveToiaaCompleted(trelloEvent)
        .then(() => {
          test.fail('rejects');
        })
        .catch(e => {
          test.pass('rejects');
          test.equal(trelloGet.callCount, 0, 'does not call trello get');
          test.equal(trelloPut.callCount, 0, 'does not call trello put');
          test.equal(e.message, 'Not a card move', 'returns the expected error');
        })
        .then(test.done);
    });

    eventTest.test('event is a card move, but not into IAA Completed', test => {
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
      moveToiaaCompleted(trelloEvent)
        .then(() => {
          test.fail('rejects');
        })
        .catch(e => {
          test.pass('rejects');
          test.equal(trelloGet.callCount, 0, 'does not call trello get');
          test.equal(trelloPut.callCount, 0, 'does not call trello put');
          test.equal(e.message, 'Not a move into IAA Completed Work Begin', 'returns the expected error');
        })
        .then(test.done);
    });

    eventTest.test('event is a card move into IAA Completed, but not a BPA card', test => {
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
              name: 'IAA Completed Work Begin'
            }
          }
        }
      };
      moveToiaaCompleted(trelloEvent)
        .then(() => {
          test.fail('rejects');
        })
        .catch(e => {
          test.pass('rejects');
          test.equal(trelloGet.callCount, 0, 'does not call trello get');
          test.equal(trelloPut.callCount, 0, 'does not call trello put');
          test.equal(e.message, 'Not an Agile  BPA card', 'returns the expected error');
        })
        .then(test.done);
    });

    eventTest.test('event is a BPA card move into IAA Completed', trelloGetTest => {
      const trelloEvent = {
        action: {
          type: 'updateCard',
          data: {
            card: {
              id: 'card-id',
              name: `Agile BPA Test Card`
            },
            listBefore: {
              name: 'list-before'
            },
            listAfter: {
              name: 'IAA Completed Work Begin'
            }
          }
        }
      };

      trelloGetTest.test('trello get rejects', test => {
        trelloGet.rejects(err);

        moveToiaaCompleted(trelloEvent)
          .then(() => {
            test.fail('rejects');
          })
          .catch(e => {
            test.pass('rejects');
            test.equal(trelloGet.callCount, 1, 'calls trello get one time');
            test.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'calls the expected URL');
            test.equal(trelloPut.callCount, 0, 'does not call trello put');
            test.equal(e, err, 'returns the expected error');
          })
          .then(test.done);
      });

      trelloGetTest.test('trello get resolves a card with no BPA links', test => {
        trelloGet.resolves({ name: trelloEvent.action.data.card.name, desc: 'Some description' });

        moveToiaaCompleted(trelloEvent)
          .then(() => {
            test.fail('rejects');
          })
          .catch(e => {
            test.pass('rejects');
            test.equal(trelloGet.callCount, 1, 'calls trello get one time');
            test.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'calls the expected URL');
            test.equal(trelloPut.callCount, 0, 'does not call trello put');
            test.equal(e.message, 'Intake BPA does not have an associated BPA Dashboard card', 'returns the expected error');
          })
          .then(test.done);
      });

      trelloGetTest.test('trello get resolves a card with BPA links', trelloPutTest => {
        const bpaCardID = 'bpa-card-id';
        const resolvedCard = {
          name: trelloEvent.action.data.card.name,
          desc: '### Agile BPA Links\n\n* [BPA Dashboard](https://trello.com/c/' + bpaCardID + '/00-card-name)'
        };

        trelloPutTest.test('trello put rejects', test => {
          trelloGet.resolves(resolvedCard);
          trelloPut.rejects(err);

          moveToiaaCompleted(trelloEvent)
            .then(() => {
              test.fail('rejects');
            })
            .catch(e => {
              test.pass('rejects');
              test.equal(trelloGet.callCount, 1, 'calls trello get one time');
              test.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'calls the expected URL');
              test.equal(trelloPut.callCount, 1, 'calls trello put one time');
              test.equal(trelloPut.args[0][0], `/1/cards/${bpaCardID}/idList`, 'calls the expected URL');
              test.same(trelloPut.args[0][1], { value: process.env.TRELLO_BPA_WORKSHOP_PREP_LIST_ID }, 'sends the expected list ID');
              test.equal(e, err, 'returns the expected error');
            })
            .then(test.done);
        });

        trelloPutTest.test('trello put resolves', test => {
          trelloGet.resolves(resolvedCard);
          trelloPut.resolves();

          moveToiaaCompleted(trelloEvent)
            .then(() => {
              test.pass('resolves');
              test.equal(trelloGet.callCount, 1, 'calls trello get one time');
              test.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'calls the expected URL');
              test.equal(trelloPut.callCount, 1, 'calls trello put one time');
              test.equal(trelloPut.args[0][0], `/1/cards/${bpaCardID}/idList`, 'calls the expected URL');
              test.same(trelloPut.args[0][1], { value: process.env.TRELLO_BPA_WORKSHOP_PREP_LIST_ID }, 'sends the expected list ID');
            })
            .catch(e => {
              test.fail('resolves');
            })
            .then(test.done);
        });

        trelloPutTest.done();
      });

      trelloGetTest.done();
    });

    eventTest.done();
  });

  listIDTest.done();
});
