'use strict';

const tap = require('tap');
const sinon = require('sinon');
const trello = require('node-trello');

process.env.TRELLO_API_KEY = 'trello-api-key';
process.env.TRELLO_API_TOK = 'trello-api-tok';

const createBPAOrderCard = require('../../actions/create-bpa-order-card');

// Disable logging to the console.
require('@erdc-itl/simple-logger').setOptions({ console: false });

const cardName = 'card-name';
const agency = 'agency-name';
const subagency = 'subagency-name';
const boardURL = 'https://some.board.url/asdf';

tap.test('actions - create BPA order card', t1 => {
  const sandbox = sinon.sandbox.create();
  const trelloPost = sandbox.stub(trello.prototype, 'post');

  t1.beforeEach(done => {
    sandbox.reset();
    done();
  });

  t1.teardown(() => {
    sandbox.restore();
  });

  t1.test('without IAA list ID environment variable', t2 => {
    delete process.env.TRELLO_BPA_IAA_LIST_ID;
    trelloPost.yields(null, '');
    createBPAOrderCard(cardName, agency, subagency, boardURL)
      .then(() => {
        t2.fail('rejects');
      })
      .catch(() => {
        t2.pass('rejects');
        t2.equal(trelloPost.callCount, 0, 'does not call Trello post');
      })
      .then(t2.done);
  });

  t1.test('with IAA list ID environment variable set', t2 => {
    process.env.TRELLO_BPA_IAA_LIST_ID = 'bpa-iaa-list-id';

    const expectedCardObj = {
      name: cardName,
      desc: `* Project: \n* Agency: ${agency}\n* SubAgency: ${subagency}\n* Trello Board: ${boardURL}\n* Open date: ${`${new Date().getMonth() + 1}/${new Date().getDate()}/${`${new Date().getFullYear()}`.substr(2)}`}`,
      idList: process.env.TRELLO_BPA_IAA_LIST_ID
    };

    t2.test('Trello post returns an error', t3 => {
      const err = new Error('Test error');
      trelloPost.yields(err, null);

      createBPAOrderCard(cardName, agency, subagency, boardURL)
        .then(() => {
          t3.fail('rejects');
        })
        .catch(e => {
          t3.pass('rejects');
          t3.equal(trelloPost.callCount, 1, 'calls trello post one time');
          t3.equal(trelloPost.args[0][0], '/1/cards/', 'posts to the correct URL');
          t3.same(trelloPost.args[0][1], expectedCardObj, 'passes in the correct card info');
          t3.equal(e, err, 'returns the expected error');
        })
        .then(t3.done);
    });

    t2.test('Trello post returns successfully', t3 => {
      const cardFromTrello = {
        name: 'from-trello'
      };
      trelloPost.yields(null, cardFromTrello);

      createBPAOrderCard(cardName, agency, subagency, boardURL)
        .then(card => {
          t3.pass('resolves');
          t3.equal(trelloPost.callCount, 1, 'calls trello post one time');
          t3.equal(trelloPost.args[0][0], '/1/cards/', 'posts to the correct URL');
          t3.same(trelloPost.args[0][1], expectedCardObj, 'passes in the correct card info');
          t3.equal(card, cardFromTrello, 'resolves the card from Trello');
        })
        .catch(() => {
          t3.fail('resolves');
        })
        .then(t3.done);
    });

    t2.done();
  })
  t1.done();
});
