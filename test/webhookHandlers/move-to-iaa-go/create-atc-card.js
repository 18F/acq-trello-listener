const tap = require('tap');
const sinon = require('sinon');
require('sinon-as-promised');

process.env.TRELLO_API_KEY = 'trello-api-key';
process.env.TRELLO_API_TOK = 'trello-api-tok';

const trello = require('../../../trello');
const actions = require('../../../actions');
const createATCCard = require('../../../webhookHandlers/intake/move-to-iaa-go/create-atc-card');

const sandbox = sinon.sandbox.create();
const trelloGet = sandbox.stub(trello, 'get');
const trelloPut = sandbox.stub(trello, 'put');
const createATCCardAction = sandbox.stub(actions, 'createATCCard');

// Disable logging to the console.
require('@erdc-itl/simple-logger').setOptions({ console: false });

tap.test('webhook handlers - intake: move to IAA Go > create ATC components', t1 => {
  t1.beforeEach(done => {
    sandbox.reset();
    done();
  });
  t1.teardown(() => {
    sandbox.restore();
  });

  const trelloEvent = {
    action: { data: { card: { id: 'intake-card-id' }}}
  };

  t1.test('trello get returns an error', t2 => {
    const err = new Error('Test error');
    trelloGet.rejects(err);

    createATCCard(trelloEvent)
      .then(() => {
        t2.fail('rejects');
      })
      .catch(e => {
        t2.pass('rejects');
        t2.equal(trelloGet.callCount, 1, 'calls Trello get one time');
        t2.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
        t2.equal(e, err, 'returns the expected error');
      })
      .then(t2.done);
  });

  t1.test('trello returns a card that already has an ATC link', t2 => {
    const intakeCard = {
      desc: '---\n\n* [Air Traffic Control](https://atc)'
    };
    trelloGet.resolves(intakeCard);

    createATCCard(trelloEvent)
      .then(() => {
        t2.fail('rejects')
      })
      .catch(e => {
        t2.pass('rejects');
        t2.equal(trelloGet.callCount, 1, 'calls Trello get one time');
        t2.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
        t2.equal(e.message, 'Intake card already has a link to ATC card', 'returns the expected error');
      })
      .then(t2.done);
  });

  t1.test('trello returns a card that does not already have an ATC link', t2 => {
    const intakeCard = {
      id: 'intake-card-id',
      desc: '',
      url: 'https://intake-card.url'
    };

    t2.test('createATCCard rejects', t3 => {
      const err = new Error('Test error');
      trelloGet.resolves(intakeCard);
      createATCCardAction.rejects(err);

      createATCCard(trelloEvent)
        .then(() => {
          t3.fail('rejects');
        })
        .catch(e => {
          t3.pass('rejects');
          t3.equal(trelloGet.callCount, 1, 'calls Trello get one time');
          t3.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
          t3.equal(createATCCardAction.callCount, 1, 'calls createATCCard action one time');
          t3.equal(createATCCardAction.args[0][0], intakeCard.name, 'uses the intake card name');
          t3.equal(createATCCardAction.args[0][0], intakeCard.name, 'uses the intake card URL');
          t3.equal(e, err, 'returns the expected error');
        })
        .then(t3.done);
    });

    t2.test('createATCCard resolves', t3 => {
      const atcCard = {
        url: 'https://atc-card.url'
      };

      t3.test('trello put returns an error', t4 => {
        const err = new Error('Test error');
        trelloGet.resolves(intakeCard);
        createATCCardAction.resolves(atcCard);
        trelloPut.rejects(err);

        createATCCard(trelloEvent)
          .then(() => {
            t4.fail('rejects');
          })
          .catch(e => {
            t4.pass('rejects');
            t4.equal(trelloGet.callCount, 1, 'calls Trello get one time');
            t4.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
            t4.equal(createATCCardAction.callCount, 1, 'calls createATCCard action one time');
            t4.equal(createATCCardAction.args[0][0], intakeCard.name, 'uses the intake card name');
            t4.equal(createATCCardAction.args[0][0], intakeCard.name, 'uses the intake card URL');
            t4.equal(trelloPut.callCount, 1, 'calls Trello put one time');
            t4.equal(trelloPut.args[0][0], `/1/cards/${intakeCard.id}/desc`, 'updates the correct card');
            t4.same(trelloPut.args[0][1], { value: `---\n\n* [Air Traffic Control](${atcCard.url})`}, 'updates with the correct ATC card link');
            t4.equal(e, err, 'returns the expected error');
          })
          .then(t4.done);
      });

      t3.test('trello put returns okay', t4 => {
        t4.test('ATC card does not have a description', t5 => {
          trelloGet.resolves(intakeCard);
          createATCCardAction.resolves(atcCard);
          trelloPut.resolves();

          createATCCard(trelloEvent)
            .then(() => {
              t5.pass('resolves');
              t5.equal(trelloGet.callCount, 1, 'calls Trello get one time');
              t5.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
              t5.equal(createATCCardAction.callCount, 1, 'calls createATCCard action one time');
              t5.equal(createATCCardAction.args[0][0], intakeCard.name, 'uses the intake card name');
              t5.equal(createATCCardAction.args[0][0], intakeCard.name, 'uses the intake card URL');
              t5.equal(trelloPut.callCount, 1, 'calls Trello put one time');
              t5.equal(trelloPut.args[0][0], `/1/cards/${intakeCard.id}/desc`, 'updates the correct card');
              t5.same(trelloPut.args[0][1], { value: `---\n\n* [Air Traffic Control](${atcCard.url})`}, 'updates with the correct ATC card link');
            })
            .catch(e => {
              t5.fail('resolves');
            })
            .then(t5.done);
        });

        t4.test('ATC card does already have a description', t5 => {
          const intakeCardWithDesc = JSON.parse(JSON.stringify(intakeCard));
          intakeCardWithDesc.desc = 'Existing description';
          trelloGet.resolves(intakeCardWithDesc);
          createATCCardAction.resolves(atcCard);
          trelloPut.resolves();

          createATCCard(trelloEvent)
            .then(() => {
              t5.pass('resolves');
              t5.equal(trelloGet.callCount, 1, 'calls Trello get one time');
              t5.equal(trelloGet.args[0][0], `/1/cards/${trelloEvent.action.data.card.id}`, 'requests correct card');
              t5.equal(createATCCardAction.callCount, 1, 'calls createATCCard action one time');
              t5.equal(createATCCardAction.args[0][0], intakeCard.name, 'uses the intake card name');
              t5.equal(createATCCardAction.args[0][0], intakeCard.name, 'uses the intake card URL');
              t5.equal(trelloPut.callCount, 1, 'calls Trello put one time');
              t5.equal(trelloPut.args[0][0], `/1/cards/${intakeCard.id}/desc`, 'updates the correct card');
              t5.same(trelloPut.args[0][1], { value: `${intakeCardWithDesc.desc}\n\n---\n\n* [Air Traffic Control](${atcCard.url})`}, 'updates with the correct ATC card link');
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

  t1.done();
});
