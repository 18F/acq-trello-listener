'use strict';

const CARD_MOVED_TYPE = 'CardMoved';

module.exports = function getEventType(trelloEvent) {
  if (trelloEvent.action.type === 'updateCard' && trelloEvent.action.data.listAfter && trelloEvent.action.data.listBefore) {
    return CARD_MOVED_TYPE;
  }
  return null;
};

module.exports.CardMoved = CARD_MOVED_TYPE;
