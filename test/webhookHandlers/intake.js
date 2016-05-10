'use strict';

const tap = require('tap');
const sinon = require('sinon');
require('sinon-as-promised');
const trello = require('node-trello');

process.env.TRELLO_API_KEY = 'trello-api-key';
process.env.TRELLO_API_TOK = 'trello-api-tok';

const actions = require('../../actions');
const intakeHandler = require('../../webhookHandlers/intake');

// Disable logging to the console.
require('@erdc-itl/simple-logger').setOptions({ console: false });

tap.test('webhook handlers - intake', t1 => {
  t1.test('event is not a card move', t2 => {
    const trelloEvent = {
      action: {
        type: 'Something'
      }
    };
    intakeHandler(trelloEvent)
      .then(() => {
        t2.fail('rejects');
      })
      .catch(() => {
        t2.pass('rejects');
      })
      .then(t2.done);
  });

  t1.test('event is a card move', t2 => {
    t2.test('card name does not start with Agile BPA', t3 => {
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
      intakeHandler(trelloEvent)
        .then(() => {
          t3.fail('rejects');
        })
        .catch((e) => {
          t3.pass('rejects');
        })
        .then(t3.done);
    });

    t2.test('card name does start with Agile BPA', t3 => {
      t3.test('move is not into IAA Go list', t4 => {
        const trelloEvent = {
          action: {
            type: 'updateCard',
            data: {
              card: {
                id: 'card-id',
                name: 'Agile BPA / Agency / Name'
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
        intakeHandler(trelloEvent)
          .then(() => {
            t4.fail('rejects');
          })
          .catch((e) => {
            t4.pass('rejects');
          })
          .then(t4.done);
      });

      t3.test('move is into IAA Go list', t4 => {
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

        const sandbox = sinon.sandbox.create();
        const trelloGet = sandbox.stub(trello.prototype, 'get');
        const trelloPut = sandbox.stub(trello.prototype, 'put');
        const createBPAOrderBoard = sandbox.stub(actions, 'createBPAOrderBoard');
        const createBPAOrderCard = sandbox.stub(actions, 'createBPAOrderCard');

        t4.beforeEach(done => {
          sandbox.reset();
          done();
        });
        t4.teardown(() => {
          sandbox.restore();
        });

        t4.test('trello get returns an error', t5 => {
          const err = new Error('Test error');
          trelloGet.yields(err, null);
          intakeHandler(trelloEvent)
            .then(() => {
              t5.fail('rejects');
            })
            .catch(e => {
              t5.pass('rejects');
              t5.equal(trelloGet.callCount, 1, 'calls Trello get one time');
              t5.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
              t5.equal(e, err, 'returns the expected error');
            })
            .then(t5.done);
        });

        t4.test('trello returns a card that already has Agile BPA links', t5 => {
          trelloGet.yields(null, { desc: '**Agile BPA Links**\n\n' });
          intakeHandler(trelloEvent)
            .then(() => {
              t5.fail('rejects');
            })
            .catch(() => {
              t5.pass('rejects');
              t5.equal(trelloGet.callCount, 1, 'calls Trello get one time');
              t5.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
            })
            .then(t5.done);
        });

        t4.test('trello returns a card without Agile BPA links', t5 => {
          const cardFromTrello = { desc: '', id: 'card-id', name: trelloEvent.action.data.card.name };

          t5.test('creating BPA order board rejects', t6 => {
            trelloGet.yields(null, cardFromTrello);
            const err = new Error('Test error');
            createBPAOrderBoard.rejects(err);

            intakeHandler(trelloEvent)
              .then(() => {
                t6.fail('rejects');
              })
              .catch(e => {
                t6.pass('rejects');
                t6.equal(trelloGet.callCount, 1, 'calls Trello get one time');
                t6.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
                t6.equal(createBPAOrderBoard.callCount, 1, 'calls create BPA order board one time');
                t6.equal(createBPAOrderBoard.args[0][0], cardFromTrello.name, 'board name argument is card name');
                t6.equal(e, err, 'returns the expected error');
              })
              .then(t6.done);
          });

          t5.test('creating BPA order board resolves', t6 => {
            const boardURL = 'https://some.board.url/asdf';

            t6.test('creating BPA order card rejects', t7 => {
              trelloGet.yields(null, cardFromTrello);
              createBPAOrderBoard.resolves(boardURL);
              const err = new Error('Test error');
              createBPAOrderCard.rejects(err);

              intakeHandler(trelloEvent)
                .then(() => {
                  t7.fail('rejects');
                })
                .catch(e => {
                  t7.pass('rejects');
                  t7.equal(trelloGet.callCount, 1, 'calls Trello get one time');
                  t7.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
                  t7.equal(createBPAOrderBoard.callCount, 1, 'calls create BPA order board one time');
                  t7.equal(createBPAOrderBoard.args[0][0], cardFromTrello.name, 'board name equals card name');
                  t7.equal(createBPAOrderCard.callCount, 1, 'calls create BPA order card one time');
                  t7.equal(createBPAOrderCard.args[0][0], project, 'project argument is project name from card name');
                  t7.equal(createBPAOrderCard.args[0][1], agency, 'agency argument is agency name from card name');
                  t7.equal(e, err, 'returns the expected error');
                })
                .then(t7.done);
            });

            t6.test('creating BPA order card resolves', t7 => {
              const bpaCard = { url: 'https://some.card.url/fdsa' };

              t7.test('trello put returns an error', t8 => {
                trelloGet.yields(null, cardFromTrello);
                createBPAOrderBoard.resolves(boardURL);
                createBPAOrderCard.resolves(bpaCard);
                const err = new Error('Test error');
                trelloPut.yields(err, null);

                intakeHandler(trelloEvent)
                  .then(() => {
                    t8.fail('rejects');
                  })
                  .catch(e => {
                    t8.pass('rejects');
                    t8.equal(trelloGet.callCount, 1, 'calls Trello get one time');
                    t8.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
                    t8.equal(createBPAOrderBoard.callCount, 1, 'calls create BPA order board one time');
                    t8.equal(createBPAOrderBoard.args[0][0], cardFromTrello.name, 'board name equals card name');
                    t8.equal(createBPAOrderCard.callCount, 1, 'calls create BPA order card one time');
                    t8.equal(createBPAOrderCard.args[0][0], project, 'project argument is project name from card name');
                    t8.equal(createBPAOrderCard.args[0][1], agency, 'agency argument is agency name from card name');
                    t8.equal(trelloPut.callCount, 1, 'calls Trello put one time');
                    t8.equal(trelloPut.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}/desc`, 'updates correct card description');
                    t8.same(trelloPut.args[0][1], { value: `**Agile BPA Links**\n\n* Management Board: ${boardURL}\n* BPA Dashboard: ${bpaCard.url}`});
                    t8.equal(e, err, 'returns the expected error');
                  })
                  .then(t8.done);
              });

              t7.test('trello put succeeds', t8 => {
                trelloGet.yields(null, cardFromTrello);
                createBPAOrderBoard.resolves(boardURL);
                createBPAOrderCard.resolves(bpaCard);
                trelloPut.yields(null, '');

                intakeHandler(trelloEvent)
                  .then(() => {
                    t8.pass('resolves');
                    t8.equal(trelloGet.callCount, 1, 'calls Trello get one time');
                    t8.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
                    t8.equal(createBPAOrderBoard.callCount, 1, 'calls create BPA order board one time');
                    t8.equal(createBPAOrderBoard.args[0][0], cardFromTrello.name, 'board name equals card name');
                    t8.equal(createBPAOrderCard.callCount, 1, 'calls create BPA order card one time');
                    t8.equal(createBPAOrderCard.args[0][0], project, 'project argument is project name from card name');
                    t8.equal(createBPAOrderCard.args[0][1], agency, 'agency argument is agency name from card name');
                    t8.equal(trelloPut.callCount, 1, 'calls Trello put one time');
                    t8.equal(trelloPut.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}/desc`, 'updates correct card description');
                    t8.same(trelloPut.args[0][1], { value: `**Agile BPA Links**\n\n* Management Board: ${boardURL}\n* BPA Dashboard: ${bpaCard.url}`});
                  })
                  .catch(() => {
                    t8.fail('rejects');
                  })
                  .then(t8.done);
              });

              t7.test('trello put succeeds, this time where the card already has a description', t8 => {
                cardFromTrello.desc = 'An existing description';
                trelloGet.yields(null, cardFromTrello);
                createBPAOrderBoard.resolves(boardURL);
                createBPAOrderCard.resolves(bpaCard);
                trelloPut.yields(null, '');

                intakeHandler(trelloEvent)
                  .then(() => {
                    t8.pass('resolves');
                    t8.equal(trelloGet.callCount, 1, 'calls Trello get one time');
                    t8.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
                    t8.equal(createBPAOrderBoard.callCount, 1, 'calls create BPA order board one time');
                    t8.equal(createBPAOrderBoard.args[0][0], cardFromTrello.name, 'board name equals card name');
                    t8.equal(createBPAOrderCard.callCount, 1, 'calls create BPA order card one time');
                    t8.equal(createBPAOrderCard.args[0][0], project, 'project argument is project name from card name');
                    t8.equal(createBPAOrderCard.args[0][1], agency, 'agency argument is agency name from card name');
                    t8.equal(trelloPut.callCount, 1, 'calls Trello put one time');
                    t8.equal(trelloPut.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}/desc`, 'updates correct card description');
                    t8.same(trelloPut.args[0][1], { value: `${cardFromTrello.desc}\n\n**Agile BPA Links**\n\n* Management Board: ${boardURL}\n* BPA Dashboard: ${bpaCard.url}`});
                  })
                  .catch(() => {
                    t8.fail('rejects');
                  })
                  .then(t8.done);
              });

              t7.done();
            });

            t6.done();
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
