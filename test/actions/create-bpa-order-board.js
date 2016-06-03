'use strict';

const tap = require('tap');
const sinon = require('sinon');
const trello = require('node-trello');

process.env.TRELLO_API_KEY = 'trello-api-key';
process.env.TRELLO_API_TOK = 'trello-api-tok';

const sandbox = sinon.sandbox.create();
const trelloPost = sandbox.stub(trello.prototype, 'post');

const createBPAOrderBoard = require('../../actions/create-bpa-order-board');

// Disable logging to the console.
require('@erdc-itl/simple-logger').setOptions({ console: false });

tap.test('actions - create BPA order board', t1 => {
  const boardName = 'test-board-name';

  t1.beforeEach(done => {
    sandbox.reset();
    done();
  });

  t1.teardown(() => {
    sandbox.restore();
  });

  t1.test('Trello post returns an error', t2 => {
    const err = new Error('Test error');
    trelloPost.yields(err, null);
    createBPAOrderBoard(boardName)
      .then(() => {
        t2.fail('rejects');
      })
      .catch(e => {
        t2.pass('rejects');
        t2.equal(trelloPost.callCount, 1, 'calls Trello post one time');
        t2.equal(trelloPost.args[0][0], '/1/boards', 'calls the correct URL');
        t2.same(trelloPost.args[0][1], { name: boardName, defaultLists: false, prefs_permissionLevel: 'private' }, 'sends the correct board metadata');
        t2.equal(e, err, 'returns the expected error');
      })
      .then(t2.done);
  });

  t1.test('Trello post returns successfully', t2 => {
    const boardURL = 'https://some.board.url/asdf';
    trelloPost.yields(null, { url: boardURL });
    createBPAOrderBoard(boardName)
      .then(board => {
        t2.pass('resolves');
        t2.equal(trelloPost.callCount, 1, 'calls Trello post one time');
        t2.equal(trelloPost.args[0][0], '/1/boards', 'calls the correct URL');
        t2.same(trelloPost.args[0][1], { name: boardName, defaultLists: false, prefs_permissionLevel: 'private' }, 'sends the correct board metadata');
        t2.equal(typeof board, 'object', 'resolves a board object');
        t2.equal(board.url, boardURL, 'resolved board contains the correct board URL');
      })
      .catch(() => {
        t2.fail('resolves');
      })
      .then(t2.done);
  });

  t1.done();
});
