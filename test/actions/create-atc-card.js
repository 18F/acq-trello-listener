'use strict';

const tap = require('tap');
const sinon = require('sinon');
require('sinon-as-promised');

process.env.TRELLO_API_KEY = 'trello-api-key';
process.env.TRELLO_API_TOK = 'trello-api-tok';

const trello = require('../../trello');
const sandbox = sinon.sandbox.create();
const trelloPost = sandbox.stub(trello, 'post');

const createATCCard = require('../../actions/create-atc-card');

// Disable logging to the console.
require('@erdc-itl/simple-logger').setOptions({ console: false });

const atcCardName = 'atc-card-name';
const intakeCardURL = 'https://intake-card.url';

tap.test('actions - create BPA order card', t1 => {
  t1.beforeEach(done => {
    sandbox.reset();
    done();
  });

  t1.teardown(() => {
    sandbox.restore();
  });

  t1.test('without preflight list ID environment variable', t2 => {
    delete process.env.TRELLO_ATC_PREFLIGHT_LIST_ID;
    createATCCard(atcCardName, intakeCardURL)
      .then(() => {
        t2.fail('rejects');
      })
      .catch(e => {
        t2.pass('rejects');
        t2.equal(trelloPost.callCount, 0, 'does not call Trello post');
        t2.equal(e.message, 'ATC Preflight list ID not ready', 'returns the expected error');
      })
      .then(t2.done);
  });

  t1.test('with IAA list ID environment variable set', t2 => {
    process.env.TRELLO_ATC_PREFLIGHT_LIST_ID = 'atc-preflight-list-id';
    const expectedPost = {
      name: atcCardName,
      idList: process.env.TRELLO_ATC_PREFLIGHT_LIST_ID,
      desc: `\n\n---\n* [Intake](${intakeCardURL})`
    };

    t2.test('trello post rejects', t3 => {
      const err = new Error('Test error');
      trelloPost.rejects(err);

      createATCCard(atcCardName, intakeCardURL)
        .then(() => {
          t3.fail('rejects');
        })
        .catch(e => {
          t3.pass('rejects');
          t3.equal(trelloPost.callCount, 1, 'trello post is called one time');
          t3.equal(trelloPost.args[0][0], `/1/cards/`, 'posts to the right URL');
          t3.same(trelloPost.args[0][1], expectedPost, 'posts the expected object');
          t3.equal(e, err, 'returns the expected error');
        })
        .then(t3.done);
    });

    t2.test('trello post resolves', t3 => {
      trelloPost.resolves();

      createATCCard(atcCardName, intakeCardURL)
        .then(() => {
          t3.pass('resolves');
          t3.equal(trelloPost.callCount, 1, 'trello post is called one time');
          t3.equal(trelloPost.args[0][0], `/1/cards/`, 'posts to the right URL');
          t3.same(trelloPost.args[0][1], expectedPost, 'posts the expected object');
        })
        .catch(e => {
          t3.fail('resolves');
        })
        .then(t3.done);
    });

    t2.done();
  });

  t1.done();
});
