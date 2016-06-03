'use strict';

const moment = require('moment');
const trello = require('../trello');

module.exports = function createBPAOrderCard(cardName, agency, subagency, managementBoardURL) {
  if (process.env.TRELLO_BPA_IAA_LIST_ID) {
    return trello.post('/1/cards/', {
      name: cardName,
      desc: `* Project: \n* Agency: ${agency}\n* SubAgency: ${subagency}\n* Trello Board: ${managementBoardURL}\n* Open date: ${moment(new Date()).format('M/D/YY')}`,
      idList: process.env.TRELLO_BPA_IAA_LIST_ID
    });
  } else {
    return Promise.reject('BPA IAA list ID not ready');
  }
};
