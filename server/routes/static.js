const express = require('express'),
		portfolioController = require("./../controllers/portfolio"),
		userController = require("./../controllers/user"),
		transactionController = require("./../controllers/transactions"),
		bluebird = require("bluebird"),
		_ = require("lodash");

const router = new express.Router();

function limitUser(user) {
	var total_earnings = 0;
	var capital = 0;
	var valorisation = 0;
	var totalProtection = 0;
	var limitedPortfolio = user.portfolios.map((port) => {
  	 var obj = {
		_id : port._id,
		name : port.name
  	 };
  	 if (port['default'] == true) {
			 obj.selected = true;
  	 }
	 var deposit_amount = port._id.deposit_amount || 0;
	 var plus_value = port._id.net_asset_value-deposit_amount;
	 obj._id.plus_value = plus_value;
	 obj._id.deposit_amount = deposit_amount;
	 capital += parseInt(deposit_amount);
	 total_earnings += parseInt(plus_value);
	 totalProtection += port._id.net_asset_value_protected;
	 valorisation = valorisation+parseInt(deposit_amount)+parseInt(plus_value);
  	 return obj;
  });
  user.portfolios = limitedPortfolio;
  total_earnings = Math.round(total_earnings);
  capital = Math.round(capital);
  valorisation = Math.round(valorisation);
  totalProtection = Math.round(totalProtection);

  return {user:user,numbs:{total_earnings,capital,valorisation,totalProtection}};
}

router.get('/', (req,res,next) => {
  var obj = _.cloneDeep(req.session.user);
  var limitedUser = limitUser(obj);
  var sendObject = {user: limitedUser.user, numbs:limitedUser.numbs};
  if (req.session.notification) {
	sendObject.notification = req.session.notification;
  }
  	banque = sendObject.user.bank.activated || false;
  	legal = sendObject.user.legal.done || false;
  	if (!banque) {
  		sendObject.bank = true
  	}
  	if (!legal) {
  		sendObject.legal = true
  	}
	sendObject.dashboard = true;
	console.log(sendObject);
	console.log(sendObject.user.portfolios);
  res.render('index', sendObject);
  delete req.session.notification
})

router.get('/deposit', (req,res,next) => {
  var obj = _.cloneDeep(req.session.user);
  var limitedUser = limitUser(obj).user;
  var sendObject = {user: limitedUser};
  if (req.session.notification) {
		sendObject.notification = req.session.notification;
  }
  if (limitedUser.numerics) {
  	if (limitedUser.numerics.premier_versement && limitedUser.numerics.premier_versement !== null) {
  		sendObject.premier = limitedUser.numerics.premier_versement
  	}
  	if (limitedUser.numerics.frequence_versement && limitedUser.numerics.frequence_versement !== null) {
  		sendObject.freq = limitedUser.numerics.frequence_versement
  	}
  	if (limitedUser.numerics.versement && limitedUser.numerics.versement !== null) {
  		sendObject.deuxieme = limitedUser.numerics.versement
  	}
  }
  if (limitedUser.bank.activated) {
  	sendObject.banque = limitedUser.bank.bankName+" : "+limitedUser.bank.iban;
  	console.log(sendObject);
  	res.render('deposit', sendObject);
  } else {
  	res.redirect('/app/banque')
  }
  
})

router.get('/retrait', (req,res,next) => {
  var obj = _.cloneDeep(req.session.user);
  var limitedUser = limitUser(obj).user;
  var sendObject = {user: limitedUser};
  if (req.session.notification) {
		sendObject.notification = req.session.notification;
  }
  if (limitedUser.bank.activated) {
  	sendObject.banque = limitedUser.bank.bankName+" : "+limitedUser.bank.iban;
  	console.log(sendObject);
  	res.render('retrait', sendObject);
  } else {
  	res.redirect('/app/banque')
  }
  
})

router.get('/performance', (req,res,next) => {
  var obj = _.cloneDeep(req.session.user);
  var limitedUser = limitUser(obj).user;
  var sendObject = {user: limitedUser};
  if (req.session.notification) {
		sendObject.notification = req.session.notification;
  }
  res.render('performance', sendObject);
})

router.get('/portfolios', (req,res,next) => {
  var obj = _.cloneDeep(req.session.user);
  var limitedUser = limitUser(obj).user;
	var update = obj.portfolios.map((port) => {
		var el = _.cloneDeep(port);
		el._id.net_asset_value = Math.round(el._id.net_asset_value)
		el._id.plus_value = Math.round(el._id.plus_value) 
		if (port._id.fiscal_type == "Assurance vie") {
			el.class = "av";
		} else if (port._id.fiscal_type == "PERP") {
			el.class = "pe";
		} else if (port._id.fiscal_type == "Compte titre") {
			el.class = "ct";
		}
		return el;
	});
	limitedUser.portfolios = update;
  var sendObject = {user: limitedUser};
  if (req.session.notification) {
	sendObject.notification = req.session.notification;
  }
  res.render('portfolios', sendObject);
})

router.get('/transfer', (req,res,next) => {
	console.log("bank activated : "+req.session.user.bank.activated);
	if (req.session.user.bank.activated == true) {
		let transfer_promises = [
			transactionController.getPendingDeposits(req.session.user._id),
			transactionController.getPendingRetraits(req.session.user._id)
		]
		return bluebird.all(transfer_promises)
		.then((docs) => {
			var toSend = {user:req.session.user, deposits: docs[0], retraits: docs[1]}
			if (docs[0].length == 0) {
				console.log("deposits empty");
				toSend.deposits_empty = true
			}
			if (docs[1].length == 0) {
				console.log("retraits empty");
				toSend.retraits_empty = true
			}
			res.render('transfer', toSend);
		})
		// transactionController.getPendingDeposits(req.session.user._id)
		// .then((docs) => {
		// 	var toSend = {user:req.session.user, transactions: docs}
		// 	if (docs.length == 0) {
		// 		console.log("docs empty");
		// 		toSend.empty = true
		// 	}
		// 	res.render('transfer', toSend);
		// })
	} else {
		res.redirect('/app/banque')
	}
})

router.get('/newportfolio', (req,res,next) => {
  var limitedUser = limitUser(req.session.user).user;
  res.render('newportfolio', {user: limitedUser});
})

router.get('/banque', (req,res,next) => {
  var limitedUser = limitUser(req.session.user).user;
  res.render('banque', {user: limitedUser});
})

router.get('/legal', (req,res,next) => {
  var limitedUser = limitUser(req.session.user).user;
  res.render('legal', {user: limitedUser});
})

router.get('/bienvenue', (req,res,next) => {
  var limitedUser = limitUser(req.session.user).user;
  console.log(limitedUser);
  res.render('welcome', {user: limitedUser});
})

router.get('/soon', (req,res,next) => {
  var limitedUser = limitUser(req.session.user).user;
  res.render('soon', {user: limitedUser});
})

router.get('/new/:from', (req,res,next) => {
  var returnPage = req.params.from;
  var limitedUser = limitUser(req.session.user).user;
  res.render('new', {user: limitedUser, frompage: returnPage});
})

router.get('/edit', (req,res,next) => {
	var limitedUser = limitUser(req.session.user).user;
	limitedUser.profile.patrimoine.map((pat) => {
		limitedUser[pat] = pat;
	})
	if (!limitedUser.newsletter) {
		delete limitedUser.newsletter;
	}
  res.render('edit', {user: limitedUser});
})

function limitPortfolio(user, id) {
	var limitedPortfolio = user.portfolios.filter((port) => {
		if (port._id._id == id) {
			return true;
		}
		return false;
	});
	if (limitedPortfolio.length == 1) {
		user.portfolios = limitedPortfolio[0];
		return user;
	}
	return null;
}

router.get('/portfolio/*', (req, res) => {
  var id = req.params['0'] || null;
	console.log("ID is "+id);
  if (id) {
		var obj = _.cloneDeep(req.session.user);
		var limitedPortfolio = limitPortfolio(obj, id);
		if (limitedPortfolio) {
			var sendObject = {user: limitedPortfolio, portId: id};
			console.log(sendObject);
			res.render('portfolio',sendObject);
		} else {
			console.log("No portfolio");
			res.redirect('/');
		}
	} else {
		console.log("No id");
		res.redirect('/');
	}
})

module.exports = router;
