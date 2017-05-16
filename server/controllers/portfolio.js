'use strict';

var bluebird = require("bluebird");

const Portfolio = require('./../models/portfolio');
const User = require('./user');
const Useri = require('./../models/users');
const Transaction = require('./../models/pending_transactions');
const TTransaction = require('./../models/treated_transactions');
const Allocations = require('./../models/allocations');
const Strategies = require('./../models/strategies');
const Expositions = require('./../models/exposition');
const portfolioData = require('./history').portfolioData;

function getCurrent(portfolios) {
  for (var i=0; i<portfolios.length; i++) {
    if (portfolios[i]['default']) {
      return portfolios[i]._id;
    }
  }
  return null;
}

exports.getCurrent = getCurrent;

function getPortfolio(portfolios) {
  var portfolio_id = getCurrent(portfolios);
  return Portfolio.findByIdAsync(portfolio_id)
  .then((portfolio) => {
    return portfolio;
  })
  .catch((err) => {
    return bluebird.Promise.reject(err);
  })
}

exports.getPortfolio = getPortfolio;

exports.getPortfolioById = getPortfolioById;

function getPortfolioById(id) {
	return Portfolio.findByIdAsync(id)
  .then((portfolio) => {
    return portfolio;
  })
  .catch((err) => {
    return bluebird.Promise.reject(err);
  })
}

function saveTransactionDepositType(userId, portfolioId, universeObject, quantity, deposit_type, recurrency) {

  let transaction_object = {
    user_id : userId,
    portfolio_id : portfolioId,
    quantity : quantity, //positive or negative
    universe : universeObject,
    deposit_type : deposit_type
  }

  if (recurrency !== null) {
    transaction_object.recurrency = recurrency
  }

  let transaction = new Transaction(transaction_object)

  return transaction.saveAsync()
  .then((nTransaction) => {
    return nTransaction
  })
  .catch((transactionSaveError) => {
    console.log(transactionSaveError);
    return bluebird.reject(transactionSaveError);
  })
}

exports.changeFunds = (req, res, next) => {
  var data = req.body;
  var user = req.session.user;
  getPortfolioById(data.portfolio)
  .then((portfolio) => {
    var error = false;
    var universeObject = {
      protection : portfolio.protection_level,
      investment_universe : portfolio.universe,
      type : 'C'
    };
    var userId = user._id;
    var portfolioId = portfolio._id;
    var promiseArray = [];
    if (data.deposit_type == "ponctuel") {
      var amount = parseInt(data.amount);
      promiseArray.push(saveTransactionDepositType(userId, portfolioId, universeObject, amount, "ponctuel", null));
      if (portfolio.deposit_amount == null) {
        portfolio.deposit_amount = 0;
      } 
      // else {
      //   portfolio.deposit_amount += amount;
      // }
      // portfolio.net_asset_value += amount;
    }
    if (data.recurrent) {
      let recurrency = {
        type: data.depot,
        start: data.start
      }
      promiseArray.push(saveTransactionDepositType(userId, portfolioId, universeObject, data.amountr, "recurrent", recurrency))
      var amountr = parseInt(data.amountr);
      var frequencyObject = {
        amount: amountr,
        type: data.depot,
        start: data.start
      };
      // portfolio.deposit_amount += amountr;
      // portfolio.net_asset_value += amountr;
      portfolio.deposit_frequency = frequencyObject;
    }
    if (data.amount < 0) { //retrait de fonds
      universeObject.protection = 0;
      universeObject.investment_universe = 0;
      // portfolio.net_asset_value -= amount;
    }
    console.log("New port");
    console.log(portfolio);
    promiseArray.push(portfolio.saveAsync());
    if (error) {
      res.status(500).json("Error with current date")
    } else {
      bluebird.all(promiseArray)
      .then((docs) => {
        console.log("DOCS");
        console.log(docs);
        return User.seeNewUser(user.email)
        .then((uUser) => {
          console.log("updated user:");
          console.log(uUser);
          delete req.session.user;
          req.session.user = uUser;
          res.status(200).json(uUser);
        })
      })
    }
  })
  .catch((portfolioError) => {
    console.log(portfolioError);
    res.status(500).json(portfolioError);
  })
}

exports.changeFundsTest = (req, res, next) => {
  var data = req.body;
  return Useri.findOneAsync({email:data.email})
  .then((user) => {

    let idd = user.portfolios.filter((el) => {
      return el.default == true
    })
    let idOk = idd[0]._id._id

    getPortfolioById(idOk)
    .then((portfolio) => {
      var error = false;
      var universeObject = {
        protection : portfolio.protection_level,
        investment_universe : portfolio.universe,
        type : 'C'
      };
      var userId = user._id;
      var portfolioId = portfolio._id;
      var promiseArray = [];
      if (data.deposit_type == "ponctuel") {
        var amount = parseInt(data.amount);
        promiseArray.push(saveTransactionDepositType(userId, portfolioId, universeObject, amount, "ponctuel", null));
        if (portfolio.deposit_amount == null) {
          portfolio.deposit_amount = 0;
        } 
        // else {
        //   portfolio.deposit_amount += amount;
        // }
        // portfolio.net_asset_value += amount;
      }
      if (data.recurrent) {
        let recurrency = {
          type: data.depot,
          start: data.start
        }
        promiseArray.push(saveTransactionDepositType(userId, portfolioId, universeObject, data.amountr, "recurrent", recurrency))
        var amountr = parseInt(data.amountr);
        var frequencyObject = {
          amount: amountr,
          type: data.depot,
          start: data.start
        };
        // portfolio.deposit_amount += amountr;
        // portfolio.net_asset_value += amountr;
        portfolio.deposit_frequency = frequencyObject;
      }
      if (data.amount < 0) { //retrait de fonds
        universeObject.protection = 0;
        universeObject.investment_universe = 0;
        portfolio.net_asset_value -= amount;
      }
      console.log("New port");
      console.log(portfolio);
      promiseArray.push(portfolio.saveAsync());
      if (error) {
        res.status(500).json("Error with current date")
      } else {
        bluebird.all(promiseArray)
        .then((docs) => {
          console.log("DOCS");
          console.log(docs);
          return User.seeNewUser(user.email)
          .then((uUser) => {
            console.log("updated user:");
            console.log(uUser);
            delete req.session.user;
            req.session.user = uUser;
            res.status(200).json(uUser);
          })
        })
      }
    })
  })
  .catch((portfolioError) => {
    console.log(portfolioError);
    res.status(500).json(portfolioError);
  })
}

exports.changeProtection = (req, res, next) => {
  var data = req.body;
  var user = req.session.user;
  getPortfolio(user.portfolios)
  .then((portfolio) => {
    var universeObject = {
      protection : data.protection_level,
      investment_universe : 0,
      type : 'P'
    };
    var transaction = new Transaction({
      user_id : user._id,
      portfolio_id : portfolio._id,
      quantity : 0,
      universe : universeObject
    })
    transaction.saveAsync()
    .then((nTransaction) => {
      console.log(nTransaction);
      req.session.notification = "Transaction de changement de protection créée !";
      portfolio.protection_level = data.protection_level;
      return portfolio.saveAsync()
      .then(() => {
			res.redirect('/app');
      })
      .catch((protectionChangeError) => {
			console.log(protectionChangeError);
      	res.status(500).json(protectionChangeError);
      })
    })
    .catch((transactionSaveError) => {
      console.log(transactionSaveError);
      res.status(500).json(transactionSaveError);
    })
  })
  .catch((portfolioError) => {
    console.log(portfolioError);
    res.status(500).json(portfolioError);
  })
}

exports.changeUniverse = (req, res, next) => {
  var data = req.body;
  var user = req.session.user;
  getPortfolio(user.portfolios)
  .then((portfolio) => {
    var universeObject = {
      protection : data.protection_level || 0,
      investment_universe : data.investment_universe,
      type : 'U'
    };
    var transaction = new Transaction({
      user_id : user._id,
      portfolio_id : portfolio._id,
      quantity : 0,
      universe : universeObject
    })
    transaction.saveAsync()
    .then((nTransaction) => {
      res.status(200).json(nTransaction);
    })
    .catch((transactionSaveError) => {
      console.log(transactionSaveError);
      res.status(500).json(transactionSaveError);
    })
  })
  .catch((portfolioError) => {
    console.log(portfolioError);
    res.status(500).json(portfolioError);
  })
}

exports.getUniverse = (req, res, next) => {
  var data = req.body;
  var user = req.session.user;
  getPortfolioById(data.portid)
  .then((port) => {
    var protection = port.protection_level;
    console.log("Got portfolio with protection: "+protection);
    Strategies.find({protection}).sort({date:-1}).limit(1).execAsync()
    .then((strats) => {
      console.log("strats:");
      console.log(strats);
      let strat = strats[0];
      let universes = strat.univers_object;
      var sendObject = []
      for (var key in universes) {
        var subObj = {
          label: key,
          value: Math.round(universes[key]*10000) / 100
        }
        sendObject.push(subObj)
      }
      console.log("UNIVERSES:");
      console.log(sendObject);
      res.status(200).json(sendObject);
    })
  })
  .catch((err) => {
    console.log(err);
    res.status(500).send();
  })
}

exports.portfolioData = (req, res, next) => {
  var data = req.body;
  var user = req.session.user;
  console.log("Got data with protection: "+data.portid);
  getPortfolioById(data.portid)
  .then((port) => {
    var protection = port.protection_level/100;
    console.log("Got portfolio with protection: "+protection);
    Allocations.find({"Milvus protection":protection}).sort({"Part":-1}).execAsync()
    .then((allocations) => {
      res.status(200).json(allocations);
    })
  })
  .catch((err) => {
    console.log(err);
    res.status(500).send();
  })
}

exports.expositions = (req,res,next) => {
  var data = req.body;
  var user = req.session.user;
  let start = data.start;
  let end = data.end;
  console.log("Start: "+start+"  --   End: "+end);
  getPortfolioById(data.portid)
  .then((port) => {
    var protection = port.protection_level;
    console.log("Got portfolio with protection: "+protection);
    Strategies.find({protection}).sort({date:-1}).limit(1).execAsync()
    .then((strats) => {
      console.log("strats:");
      console.log(strats);
      let strat = strats[0];
      let universes = strat.univers_object;
      var sendObject = []
      for (var key in universes) {
        var subObj = {
          universe: key,
          value: universes[key]
        }
        sendObject.push(subObj)
      }
      console.log("UNIVERSES:");
      console.log(sendObject);
      var expositionsObject = []
      var typesOfActif = []
      var valeurActifs = []
      return bluebird.mapSeries(sendObject,(universe)=>{
        return Expositions.find({univ_id:universe.universe,date:{$gte:start,$lte:end}}).sort({poid:-1}).execAsync()
        .then((expos)=>{
          console.log("found "+expos.length+" expositions");
          expos.map((expo)=>{
            let expoObject = {
              actif : expo.actif,
              continent : expo.continent,
              pays : expo.pays,
              Sector : expo.Sector,
              indice : expo.indice,
              poid : expo.poid*universe.value,
            }
            expositionsObject.push(expoObject)
            if (typesOfActif.indexOf(expo.actif)==(-1)) {
              typesOfActif.push(expo.actif)
              valeurActifs.push(expo.poid)
            } else {
              valeurActifs[typesOfActif.indexOf(expo.actif)] += expo.poid
            }
          })
        })
      })
      .then(()=>{
        var typesObject = []
        var labels = []
        for (var i=0; i<typesOfActif.length; i++) {
          typesObject.push({
            y: typesOfActif[i],
            a: valeurActifs[i]
          })
          labels.push(typesOfActif[i])
        }
        let sending = {
          expositions: expositionsObject,
          types: {
            data: typesObject,
            labels
          }

        }
        res.status(200).json(sending);
      })
    })
  })
  .catch((err) => {
    console.log(err);
    res.status(500).send();
  })
}

exports.updateNetAssetValue = (id, rendement) => {
  return getPortfolioById(id)
  .then((portfolio) => {
    let new_net_value = portfolio.net_asset_value*rendement
    return TTransaction.find({portfolio_id:data.portid}).sort({date:1}).execAsync()
    .then((transactions) => {
      let portfolioTransactions = transactions.map((transaction) => {
        return {
          value: transaction.quantity,
          date: transaction.treated_date
        }
      })
    })
  })
  .catch((err) => {
    console.log(err);
  })
}

exports.portfolioPerformanceData = (req, res, next) => {

  let data = req.body;
  return getPortfolioById(data.portid)
  .then((portfolio) => {
    let protection = portfolio.protection_level;
    return TTransaction.find({portfolio_id:data.portid}).sort({date:1}).execAsync()
    .then((transactions) => {
      let portfolioTransactions = transactions.map((transaction) => {
        return {
          value: transaction.quantity,
          date: transaction.treated_date
        }
      })
    })
  })
  .catch((err) => {
    console.log(err);
  })

}











