'use strict';

process.env.TRELLO_API_KEY = 'trello-api-key';
process.env.TRELLO_API_TOK = 'trello-api-tok';

const tap = require('tap');
const sinon = require('sinon');

const nodeTrello = require('node-trello');

const sandbox = sinon.sandbox.create();

const methods = [ 'get', 'put', 'post' ];
const stubs = { };
methods.forEach(method => {
  stubs[method] = sandbox.stub(nodeTrello.prototype, method);
});

const trello = require('../trello');

tap.beforeEach(done => {
  sandbox.reset();
  done();
});
tap.teardown(() => {
  sandbox.restore();
})

tap.test('trello promise wrapper', t1 => {
  methods.forEach(method => {
    t1.test(`${method} method`, t2 => {
      const trelloMethod = trello[method];

      t2.test('without callback argument', withoutCallback => {
        withoutCallback.test('node-trello method returns an error', t3 => {
          const stub = stubs[method];
          const err = new Error('Test error');
          stub.yields(err, null);

          trelloMethod()
            .then(() => {
              t3.fail('rejects');
            })
            .catch(e => {
              t3.pass('rejects');
              t3.equal(stub.callCount, 1, 'node-trello method is called once');
              t3.equal(e, err, 'returns the expected error');
            })
            .then(t3.done);
        });

        withoutCallback.test('node trello returns successfully', t3 => {
          const stub = stubs[method];
          const obj = { returned: 'object' };
          stub.yields(null, obj);

          trelloMethod()
            .then(o => {
              t3.pass('resolves');
              t3.equal(stub.callCount, 1, 'node-trello method is called once');
              t3.equal(o, obj, 'returns the expected object');
            })
            .catch(() => {
              t3.fail('resolves');
            })
            .then(t3.done);
        });

        withoutCallback.done();
      });

      t2.test('with callback argument', withCallback => {
        withCallback.test('node-trello method returns an error', t3 => {
          const stub = stubs[method];
          const err = new Error('Test error');
          stub.yields(err, null);

          trelloMethod(function(e, data) {
            t3.pass('callback called');
            t3.equal(e, err, 'returns the expected error');
            t3.equal(data, null, 'returns no data');
            t3.done();
          });
        });

        withCallback.test('node trello returns successfully', t3 => {
          const stub = stubs[method];
          const obj = { returned: 'object' };
          stub.yields(null, obj);

          trelloMethod(function(e, data) {
            t3.pass('callback called');
            t3.equal(e, null, 'returns no error');
            t3.equal(data, obj, 'returns the expected data');
            t3.done();
          });
        });

        withCallback.done();
      });

      t2.done();
    });
  });

  t1.done();
});
