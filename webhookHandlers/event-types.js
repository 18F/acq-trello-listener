'use strict';

const CARD_MOVED_TYPE = 'CardMoved';

module.exports = function getEventType(trelloEvent) {
  let eventType = null;
  try {
    if (trelloEvent.action.type === 'updateCard' && trelloEvent.action.data.listAfter && trelloEvent.action.data.listBefore) {
      eventType = CARD_MOVED_TYPE;
    }
  } catch (e) { eventType = null; }
  return eventType;
};

module.exports.CardMoved = CARD_MOVED_TYPE;
