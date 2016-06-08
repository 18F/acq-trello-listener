const tap = require('tap');
const sinon = require('sinon');
require('sinon-as-promised');

process.env.TRELLO_API_KEY = 'trello-api-key';
process.env.TRELLO_API_TOK = 'trello-api-tok';

const trello = require('../../../trello');
const actions = require('../../../actions');
const createBPAComponents = require('../../../webhookHandlers/intake/move-to-iaa-go/create-bpa-components');

const sandbox = sinon.sandbox.create();
const trelloGet = sandbox.stub(trello, 'get');
const trelloPut = sandbox.stub(trello, 'put');
const createBPAOrderBoard = sandbox.stub(actions, 'createBPAOrderBoard');
const createBPAOrderCard = sandbox.stub(actions, 'createBPAOrderCard');

// Disable logging to the console.
require('@erdc-itl/simple-logger').setOptions({ console: false });

tap.test('webhook handlers - intake: move to IAA Go > create BPA components', t1 => {
  t1.test('card name does not start with Agile BPA', t2 => {
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
            name: 'IAA Go'
          }
        }
      }
    };
    createBPAComponents(trelloEvent)
      .then(() => {
        t2.fail('rejects');
      })
      .catch((e) => {
        t2.pass('rejects');
      })
      .then(t2.done);
  });

  t1.test('card name does start with Agile BPA', t2 => {
    const project = 'Project Name';
    const agency = 'Agency Name';
    const trelloEvent = {
      action: {
        type: 'updateCard',
        data: {
          card: {
            id: 'card-id',
            name: `Agile BPA / ${agency} / ${project}`
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

    t2.beforeEach(done => {
      sandbox.reset();
      done();
    });
    t2.teardown(() => {
      sandbox.restore();
    });

    t2.test('trello get returns an error', t3 => {
      const err = new Error('Test error');
      trelloGet.rejects(err);
      createBPAComponents(trelloEvent)
        .then(() => {
          t3.fail('rejects');
        })
        .catch(e => {
          t3.pass('rejects');
          t3.equal(trelloGet.callCount, 1, 'calls Trello get one time');
          t3.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
          t3.equal(e, err, 'returns the expected error');
        })
        .then(t3.done);
    });

    t2.test('trello returns a card that already has Agile BPA links', t3 => {
      trelloGet.resolves({ desc: '---\n\n### Agile BPA Links\n\n' });
      createBPAComponents(trelloEvent)
        .then(() => {
          t3.fail('rejects');
        })
        .catch(() => {
          t3.pass('rejects');
          t3.equal(trelloGet.callCount, 1, 'calls Trello get one time');
          t3.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
        })
        .then(t3.done);
    });

    t2.test('trello returns a card without Agile BPA links', t3 => {
      const cardFromTrello = { desc: '', id: 'card-id', name: trelloEvent.action.data.card.name };

      t3.test('creating BPA order board rejects', t4 => {
        trelloGet.resolves(cardFromTrello);
        const err = new Error('Test error');
        createBPAOrderBoard.rejects(err);

        createBPAComponents(trelloEvent)
          .then(() => {
            t4.fail('rejects');
          })
          .catch(e => {
            t4.pass('rejects');
            t4.equal(trelloGet.callCount, 1, 'calls Trello get one time');
            t4.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
            t4.equal(createBPAOrderBoard.callCount, 1, 'calls create BPA order board one time');
            t4.equal(createBPAOrderBoard.args[0][0], cardFromTrello.name, 'board name argument is card name');
            t4.equal(e, err, 'returns the expected error');
          })
          .then(t4.done);
      });

      t3.test('creating BPA order board resolves', t4 => {
        const boardObj = { url: 'https://some.board.url/asdf' };

        t4.test('creating BPA order card rejects', t5 => {
          trelloGet.resolves(cardFromTrello);
          createBPAOrderBoard.resolves(boardObj);
          const err = new Error('Test error');
          createBPAOrderCard.rejects(err);

          createBPAComponents(trelloEvent)
            .then(() => {
              t5.fail('rejects');
            })
            .catch(e => {
              t5.pass('rejects');
              t5.equal(trelloGet.callCount, 1, 'calls Trello get one time');
              t5.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
              t5.equal(createBPAOrderBoard.callCount, 1, 'calls create BPA order board one time');
              t5.equal(createBPAOrderBoard.args[0][0], cardFromTrello.name, 'board name equals card name');
              t5.equal(createBPAOrderCard.callCount, 1, 'calls create BPA order card one time');
              t5.equal(createBPAOrderCard.args[0][0], project, 'project argument is project name from card name');
              t5.equal(createBPAOrderCard.args[0][1], agency, 'agency argument is agency name from card name');
              t5.equal(e, err, 'returns the expected error');
            })
            .then(t5.done);
        });

        t4.test('creating BPA order card resolves', t5 => {
          const bpaCard = { url: 'https://some.card.url/fdsa' };

          t5.test('trello put returns an error', t6 => {
            trelloGet.resolves(cardFromTrello);
            createBPAOrderBoard.resolves(boardObj);
            createBPAOrderCard.resolves(bpaCard);
            const err = new Error('Test error');
            trelloPut.rejects(err);

            createBPAComponents(trelloEvent)
              .then(() => {
                t6.fail('rejects');
              })
              .catch(e => {
                t6.pass('rejects');
                t6.equal(trelloGet.callCount, 1, 'calls Trello get one time');
                t6.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
                t6.equal(createBPAOrderBoard.callCount, 1, 'calls create BPA order board one time');
                t6.equal(createBPAOrderBoard.args[0][0], cardFromTrello.name, 'board name equals card name');
                t6.equal(createBPAOrderCard.callCount, 1, 'calls create BPA order card one time');
                t6.equal(createBPAOrderCard.args[0][0], project, 'project argument is project name from card name');
                t6.equal(createBPAOrderCard.args[0][1], agency, 'agency argument is agency name from card name');
                t6.equal(trelloPut.callCount, 1, 'calls Trello put one time');
                t6.equal(trelloPut.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}/desc`, 'updates correct card description');
                t6.same(trelloPut.args[0][1], { value: `---\n\n### Agile BPA Links\n\n* [Management Board](${boardObj.url})\n* [BPA Dashboard](${bpaCard.url})`});
                t6.equal(e, err, 'returns the expected error');
              })
              .then(t6.done);
          });

          t5.test('trello put succeeds', t6 => {
            trelloGet.resolves(cardFromTrello);
            createBPAOrderBoard.resolves(boardObj);
            createBPAOrderCard.resolves(bpaCard);
            trelloPut.resolves('');

            createBPAComponents(trelloEvent)
              .then(() => {
                t6.pass('resolves');
                t6.equal(trelloGet.callCount, 1, 'calls Trello get one time');
                t6.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
                t6.equal(createBPAOrderBoard.callCount, 1, 'calls create BPA order board one time');
                t6.equal(createBPAOrderBoard.args[0][0], cardFromTrello.name, 'board name equals card name');
                t6.equal(createBPAOrderCard.callCount, 1, 'calls create BPA order card one time');
                t6.equal(createBPAOrderCard.args[0][0], project, 'project argument is project name from card name');
                t6.equal(createBPAOrderCard.args[0][1], agency, 'agency argument is agency name from card name');
                t6.equal(trelloPut.callCount, 1, 'calls Trello put one time');
                t6.equal(trelloPut.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}/desc`, 'updates correct card description');
                t6.same(trelloPut.args[0][1], { value: `---\n\n### Agile BPA Links\n\n* [Management Board](${boardObj.url})\n* [BPA Dashboard](${bpaCard.url})`});
              })
              .catch(() => {
                t6.fail('resolves');
              })
              .then(t6.done);
          });

          t5.test('trello put succeeds, this time where the card already has a description', t6 => {
            cardFromTrello.desc = 'An existing description';
            trelloGet.resolves(cardFromTrello);
            createBPAOrderBoard.resolves(boardObj);
            createBPAOrderCard.resolves(bpaCard);
            trelloPut.resolves('');

            createBPAComponents(trelloEvent)
              .then(() => {
                t6.pass('resolves');
                t6.equal(trelloGet.callCount, 1, 'calls Trello get one time');
                t6.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
                t6.equal(createBPAOrderBoard.callCount, 1, 'calls create BPA order board one time');
                t6.equal(createBPAOrderBoard.args[0][0], cardFromTrello.name, 'board name equals card name');
                t6.equal(createBPAOrderCard.callCount, 1, 'calls create BPA order card one time');
                t6.equal(createBPAOrderCard.args[0][0], project, 'project argument is project name from card name');
                t6.equal(createBPAOrderCard.args[0][1], agency, 'agency argument is agency name from card name');
                t6.equal(trelloPut.callCount, 1, 'calls Trello put one time');
                t6.equal(trelloPut.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}/desc`, 'updates correct card description');
                t6.same(trelloPut.args[0][1], { value: `${cardFromTrello.desc}\n\n---\n\n### Agile BPA Links\n\n* [Management Board](${boardObj.url})\n* [BPA Dashboard](${bpaCard.url})`});
              })
              .catch((e) => {
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
