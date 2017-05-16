'use strict';

let bluebird = require("bluebird");

const Strategies = require('./../models/stats');
const newStrategies = require('./../models/strategies');
const History = require("./../models/portfolio_history");
var moment = require('moment');

function round(n) {
  return Math.round(n * 1000) / 1000
}

function unixSorter(a,b)
{
   return ((a.x) < (b.x)) ? 1 : -1;
}

exports.portfolioHistory = (req, res, next) => {

  console.log(req.body);

  const portfolioIds =  req.body.ids

  let totalInvested = 0
  let totalEarned = 0
  let totalProtected = 0
  let historicData = []

  return bluebird.mapSeries(portfolioIds, (portfolioId) => {

    return History.find({portfolio_id:portfolioId}).sort({date:-1}).execAsync()
    .then((histories) => {

      let portfolioValues = []
      let name = ""

      console.log(histories);

      return bluebird.mapSeries(histories, (hist,i) => {

        if (name == "") {
          name = hist.portfolio_id.name
        }
        if (i == histories.length-1) {
          totalEarned += hist.net_asset_value
          totalProtected += hist.protected_value
          console.log(hist.net_asset_value);
          if (hist.portfolio_id.deposit_amount !== null) {
            totalInvested += hist.portfolio_id.deposit_amount
          }
        }
        const rawValue = parseFloat(hist.net_asset_value)
        const unix = moment(hist.createdAt).unix();
        portfolioValues.push({x:unix,y:round(rawValue)})

      })
      .then(() =>{

        portfolioValues.sort(unixSorter)
        console.log(portfolioValues);

        historicData.push({
          "key": name,
          "values": portfolioValues.reverse()
        })

      })

    })

  })
  .then(() => {
    console.log("invested="+totalInvested+"  ;  totalEarned"+totalEarned);
    const sendData = {
      historicData,
      stats: {
        totalInvested : Math.round(totalInvested),
        totalEarned : Math.round(totalEarned),
        totalProtected : Math.round(totalProtected)
      }
    }
    res.send(sendData);
  })

}

exports.portfolioIndexHistory = (req, res, next) => {

  const portfolisIds = req.session.user.portfolios.map((el) => {
    return el._id._id
  })

  console.log(portfolisIds);
  console.log("******");

  let totalInvested = 0
  let totalEarned = 0
  let totalProtected = 0
  let historicData = []

  return bluebird.mapSeries(portfolisIds, (portfolioId) => {

    return History.find({portfolio_id:portfolioId}).sort({date:-1}).execAsync()
    .then((histories) => {

      let portfolioValues = []
      let name = ""

      console.log(histories);

      return bluebird.mapSeries(histories, (hist,i) => {

        if (name == "") {
          name = hist.portfolio_id.name
        }
        if (i == histories.length-1) {
          totalEarned += hist.net_asset_value
          totalProtected += hist.protected_value
          console.log(hist.net_asset_value);
          if (hist.portfolio_id.deposit_amount !== null) {
            totalInvested += hist.portfolio_id.deposit_amount
          }
        }
        const rawValue = parseFloat(hist.net_asset_value)
        const unix = moment(hist.createdAt).unix()*1000;

        historicData.push({
          y: moment(hist.createdAt).format("YYYY-MM-DD"),
          value: round(rawValue),
          portfolio: name
        })

      })

    })

  })
  .then(() => {
    console.log("invested="+totalInvested+"  ;  totalEarned"+totalEarned);
    let placeInArray = {}
    let objToSend = []
    let names = []
    historicData.map((hist_val) => {
      let dat = hist_val.y
      let name = hist_val.portfolio
      if (names.indexOf(name) == (-1)) {
        names.push(name)
      }
      let pval = hist_val.value
      if (dat in placeInArray) {
        let index = placeInArray[dat]
        objToSend[index][name] = pval
      } else {
        let smallObj = {
          y: dat
        }
        smallObj[name] = pval
        objToSend.push(smallObj)
        placeInArray[dat] = objToSend.length-1
      }
    })
    console.log(historicData);
    console.log("****");
    console.log(objToSend);
    res.send({
      data: objToSend,
      names: names
    });
  })

}

exports.simulationData = (req,res,next) => {
  return Strategies.find({}).sort({Date:1}).execAsync()
  .then((docs) => {
    let protec = parseInt(req.body.protection);
    console.log("protection: "+protec+"%");
    let value = round(req.body.value);
    let rawVal = value*protec/100;
    let freq = parseInt(req.body.freq);
    let freqval = parseFloat(req.body.freqval);
    console.log(freq, freqval);
    //let initialObj = [{y:"2001-6-24",a:value,b:rawVal}];
    let tot = 0;
    let elementsTest = []
    let elementsSecTest = []
    let cleanedDocs = docs.map((el, i) => {
      let rawValue = value*(1+parseFloat(el[protec]));
      let rawProtected = Math.max(rawVal,rawValue*protec/100);
      if (i%freq == 0) {
        rawValue += freqval;
        rawProtected += freqval*protec/100;
        tot++;
      }
      try {
        var unix = moment(el.dat).unix()*1000;
        //console.log(unix);
        elementsTest.push({x:unix,y:round(rawValue)})
        elementsSecTest.push({x:unix,y:round(rawProtected)})
      } catch(e) {
        //console.log(e);
      }
      value = rawValue;
      rawVal = rawProtected;
    });
    console.log("added "+tot+" times");
    let seriesOne = {
      "key": "Portfolio",
      "values": elementsTest
    }
    let seriesTwo = {
      "key": "Protection",
      "values": elementsSecTest
    }
    let sendJSON = [
      seriesOne,
      seriesTwo
    ]
    res.send(sendJSON);
    //res.send({data:docsFinal.filter((el,i)=>{return i%20==0}),max:max,min:min});
  })
  .catch((err) => {
    console.log(err);
    res.status(500).json({error:err});
  })
}

exports.portfolioData = (protection,portfolioTransactions) => {
  return newStrategies.find({protection}).sort({Date:1}).execAsync()
  .then((docs) => {
    let tot = 0;
    let elementsTest = []
    let elementsSecTest = []
    let cleanedDocs = docs.map((el, i) => {
      let rawValue = value*(1+parseFloat(el[protec]));
      let rawProtected = Math.max(rawVal,rawValue*protec/100);
      if (i%freq == 0) {
        rawValue += freqval;
        rawProtected += freqval*protec/100;
        tot++;
      }
      try {
        var unix = moment(el.dat).unix()*1000;
        //console.log(unix);
        elementsTest.push({x:unix,y:round(rawValue)})
        elementsSecTest.push({x:unix,y:round(rawProtected)})
      } catch(e) {
        //console.log(e);
      }
      value = rawValue;
      rawVal = rawProtected;
    });
    console.log("added "+tot+" times");
    let seriesOne = {
      "key": "Portfolio",
      "values": elementsTest
    }
    let seriesTwo = {
      "key": "Protection",
      "values": elementsSecTest
    }
    let sendJSON = [
      seriesOne,
      seriesTwo
    ]
    res.send(sendJSON);
    //res.send({data:docsFinal.filter((el,i)=>{return i%20==0}),max:max,min:min});
  })
  .catch((err) => {
    console.log(err);
    res.status(500).json({error:err});
  })
}