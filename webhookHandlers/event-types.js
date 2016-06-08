'use strict';

const CARD_MOVED_TYPE = 'CardMoved';
const LABEL_ADDED_TYPE = 'LabelAdded';

module.exports = function getEventType(trelloEvent) {
  let eventType = null;
  try {
    if (trelloEvent.action.type === 'updateCard' && trelloEvent.action.data.listAfter && trelloEvent.action.data.listBefore) {
      eventType = CARD_MOVED_TYPE;
    }
    else if(trelloEvent.action.type === 'addLabelToCard') {
      eventType = LABEL_ADDED_TYPE;
    }
  } catch (e) { eventType = null; }
  return eventType;
};

module.exports.CardMoved = CARD_MOVED_TYPE;
module.exports.LabelAdded = LABEL_ADDED_TYPE;
