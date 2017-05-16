'use strict';

var bluebird = require("bluebird"),
    _ = require("lodash");

const Portfolio = require('./../models/portfolio');
const User = require('./user');
const Transaction = require('./../models/pending_transactions');

exports.getPendingDeposits = (id) => {
  console.log("getting deposits for: "+id);
  return Transaction.findAsync({user_id:id, quantity: {$gt:0}})
  .then((docs) => {
    var docsWithClass = docs.map((doc) => {
      var obj = JSON.parse(JSON.stringify(doc));
      if (obj.deposit_type == "recurrent") {
        obj['rec'] = true;
      }
      return obj;
    })
    return docsWithClass;
  })
  .catch((err) => {
    console.log(err);
  })
}

exports.getPendingRetraits = (id) => {
  console.log("getting deposits for: "+id);
  return Transaction.findAsync({user_id:id, quantity: {$lt:0}})
  .then((docs) => {
    var docsWithClass = docs.map((doc) => {
      var obj = JSON.parse(JSON.stringify(doc));
      if (obj.deposit_type == "recurrent") {
        obj['rec'] = true;
      }
      obj['quantity'] = -obj['quantity']
      return obj;
    })
    return docsWithClass;
  })
  .catch((err) => {
    console.log(err);
  })
}
