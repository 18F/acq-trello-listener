'use strict';

const tap = require('tap');
const getEventType = require('../../webhookHandlers/event-types');

tap.test('webhook handlers - event types', t1 => {
  t1.test('With no data', t2 => {
    const eventType = getEventType();
    t2.equal(eventType, null, 'event type should be null');
    t2.done();
  });

  t1.test('With non-Trello data', t2 => {
    const eventType = getEventType({ some: 'fake', data: 'goes', here: true });
    t2.equal(eventType, null, 'event type should be null');
    t2.done();
  });

  t1.test('With Trello data', t2 => {
    t2.test('With unknown action type', t3 => {
      const eventType = getEventType({ action: { type: 'Unknown' }});
      t3.equal(eventType, null, 'event type should be null');
      t3.done();
    });

    t2.test('With updateCard action type', t3 => {
      const trelloEvent = {
        action: { type: 'updateCard' }
      };

      t3.test('Without listAfter or listBefore', t4 => {
        const eventType = getEventType({ action: { type: 'updateCard' }});
        t4.equal(eventType, null, 'event type should be null');
        t4.done();
      });

      t3.test('Without listAfter', t4 => {
        const eventType = getEventType({ action: { type: 'updateCard', data: { listBefore: 'list-before-id' }}});
        t4.equal(eventType, null, 'event type should be null');
        t4.done();
      });

      t3.test('Without listBefore', t4 => {
        const eventType = getEventType({ action: { type: 'updateCard', data: { listAfter: 'list-after-id' }}});
        t4.equal(eventType, null, 'event type should be null');
        t4.done();
      });

      t3.test('With listAfter and listBefore', t4 => {
        const eventType = getEventType({ action: { type: 'updateCard', data: { listAfter: 'list-after-id', listBefore: 'list-before-id' }}});
        t4.equal(eventType, getEventType.CardMoved, 'event type should be CARD_MOVED_TYPE');
        t4.done();
      });

      t3.done();
    });

    t2.done();
  });

  t1.done();
});
