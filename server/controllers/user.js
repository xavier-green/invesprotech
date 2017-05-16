'use strict';

const User = require('./../models/users');
const Portfolio = require('./../models/portfolio');
const portfolioController = require('./portfolio');
const randtoken = require('rand-token');
const sendEmail = require("./email").sendEmail;
const resetPassword = require("./email").resetPassword;
var bluebird = require("bluebird");
const fs = require("fs");

exports.registerAccount = function(data) {
  console.log("Data received:");
  console.log(data);
  var token = randtoken.generate(128);
  var patrimoine = [];
  if (data.locataire) {
    patrimoine.push("Locataire")
  }
  if (data.proprietaire) {
    patrimoine.push("Propriétaire")
  }
  if (data.investisseur) {
    patrimoine.push("Investisseur")
  }
  var plan_possede = [];
  if (data.assurance) {
    plan_possede.push("Assurance")
  }
  if (data.pea) {
    plan_possede.push("PEA")
  }
  if (data.perp) {
    plan_possede.push("PERP")
  }
  if (data.pee) {
    plan_possede.push("PEE/PEEI")
  }
  if (data.cmpt) {
    plan_possede.push("Compte titre")
  }
  var profile = {
    first_name : data.fname,
    last_name : data.lname,
    age : data.age || null,
    sex : data.sex || null,
    job_categ : data.job_categ || null,
    family_situation : data.family_situation || null,
    patrimoine : patrimoine,
    children : data.children || null,
    revenue : data.revenue || null,
    epargne : data.epargne || null, //missing : patrimoine
    pertes : data.pertes || null,
    plan_possede : plan_possede
  };
  console.log("profile:");
  console.log(profile);
  var numerics = {
    premier_versement : data.numerics_pversement || null,
    frequence_versement : data.numerics_fversement || null,
    versement : data.numerics_freq || null
  }
  console.log("numerics:");
  console.log(numerics);
  var legal = {
    done: false
  }
  console.log("legal:");
  console.log(legal);
  var user = new User({
  	profile: profile,
    email: data.email,
    password: data.password,
    legal: legal,
    phone : data.phone,
    secondary_phone : data.secondary_phone || null,
    address : data.address,
    account_type : 0,
    fiscal_type : data.fiscal_type,
    newsletter : data.newsletter,
	  token : token,
    protection_level : data.protection,
    promo_code : data.promo_code || null
  });
  console.log("*******");
  console.log(user);
  return User.findOneAsync({email:data.email})
  .then((existingUser) => {
    if (existingUser) {
      console.log("User already exists");
      return bluebird.Promise.reject("Account already exists");
    }
    console.log("User doesnt exist");
    return user.saveAsync()
    .then((mUser) => {
     //  console.log("new user saved, sending email");
    	// return sendEmail(data.email,token)
    	// .then(() => {
    		//create portfolio
        console.log("email sent, creating test port");
      return mUser.createTestPortfolio(1, data.protection) //hardcoded universe to 1
      .then((fullUser) => {
        console.log("Port created, initiating logs");
        return fullUser.logAccount(data.initial_type)
        .then(() => {
          console.log("ALL DONE");
          return seeNewUser(data.email)
          .then((updatedUser) => {
            console.log(updatedUser);
            return updatedUser
          })
        })
        .catch((logError) => {
          console.log(logError);
          return bluebird.Promise.reject(logError);
        })
      })
      .catch((testPortfolioError) => {
        console.log(testPortfolioError);
        return bluebird.Promise.reject(testPortfolioError);
      })
      //done creating portfolio
    	// })
    	.catch((tokenErr) => {
        console.log(tokenErr);
    		return bluebird.Promise.reject(newUserSaveError);
    	})
    })
    .catch((newUserSaveError) => {
      console.log(newUserSaveError);
      return bluebird.Promise.reject(newUserSaveError);
    })
  })
  .catch((searchingEmailError) => {
    console.log(searchingEmailError);
    return bluebird.Promise.reject(searchingEmailError);
  })
}

exports.addLegal = (req, res) => {

  console.log("adding legal stuff");
  var data = req.body;
  console.log(req.session.user.email);
  var user = req.session.user;
  return User.findOneAsync({email:user.email})
  .then((user) => {

    var legal = {
      cote : data.cote,
      isf : data.isf,
      expose : data.expose,
      entourage_expose : data.entourage_expose,
      done : true
    };

    user.legal = legal
    return user.saveAsync()
    .then(() => {
      return seeNewUser(user.email)
      .then((upUser) => {
        console.log("********");
        console.log(upUser);
        req.session.user = upUser;
        req.session.notification = "Votre contrat Milvus est désormais finalisé !";
        res.redirect('/app')
      })
    })
    .catch((err) => {
      console.log(err);
    })

  })
  .catch((err) => {
    console.log(err);
    res.status(200).json({error: 'User not found'})
  })

}

exports.loginAccount = function(email, password) {
  console.log("Got logging with "+email);
  return User.findOneAsync({email:email})
  .then((user) => {
    return user.comparePasswordAsync(password)
    .then((compareOutcome) => {
      if (compareOutcome) {
        console.log("Successful login");
        return user;
      }
      console.log("Login failed");
      return bluebird.Promise.reject("Authentification failed");
    })
    .catch((er) => {
      console.log(er);
      return bluebird.Promise.reject(er)
    })
  })
  .catch((err) => {
    console.log(err);
    return bluebird.Promise.reject("Authentification failed");
  })
}

exports.faketoreal = function(req, res, next) {
  var data = req.body;
  var user = req.session.user;
  portfolioController.getPortfolio(user.portfolios)
  .then((portfolio) => {
    var realPortfolio = new Portfolio({
      user_id : user._id,
      universe : portfolio.universe,
      protection_level : portfolio.protection_level
    });
    realPortfolio.saveAsync()
    .then((realPort) => {
      console.log("portfolio created");
      var newPortfolio = {
        _id : realPort._id,
        'default' : true
      }
      User.findOneAsync({email:user.email})
      .then((nUser) => {
        return nUser.setRealPortfolio(newPortfolio)
        .then((newUser) => {
          res.status(200).json(newUser);
        })
        .catch((setFalseError) => {
          console.log(setFalseError);
          res.status(500).json(setFalseError);
        })
      })
      .catch((noUserError) => {
        console.log(noUserError);
        res.status(500).json(noUserError);
      })
    })
    .catch((realPortfolioError) => {
      console.log(realPortfolioError);
      res.status(500).json(realPortfolioError);
    })
  })
  .catch((portfolioError) => {
    console.log(portfolioError);
    res.status(500).json(portfolioError);
  })
}

exports.verifyAccount = function(req, res) {
	var token = req.params['0'] || null;
	if (null) {
		res.status(200).json({error: 'No valid token specified'})
	}
	return User.findOneAsync({token:token})
	.then((user) => {
		user.activated = true;
		user.saveAsync()
		.then(() => {
			req.session.success = 'You are successfully logged in ' + user.profile.first_name + '!';
    		req.session.user = user;
    		res.render('home', {user: req.session.user.profile.first_name, newAccount: true});
		})
	})
	.catch((err) => {
		res.status(200).json({error: 'Token not found'})
	})
}

exports.addNewPortfolio = function(req, res, next) {
	var data = req.body;
	var user = req.session.user;
  var returnPage = req.params.returnpage;
	return User.findOneAsync({email:user.email})
	.then((user) => {
		return user.addPortfolio(data.name, data.universe, data.fiscal_type, data.protection)
		.then((updatedUser) => {
      return seeNewUser(user.email)
      .then((upUser) => {
        console.log("********");
        console.log(upUser);
        req.session.user = upUser;
  			req.session.notification = "Nouveau portfolio créé !";
  			res.redirect('/app/'+returnPage)
      })
      .catch((updatedError) => {
        console.log(updatedError);
        res.status(500).json(updatedError);
      })
		})
		.catch((portfolioError) => {
			console.log(portfolioError);
    	res.status(500).json(portfolioError);
		})
	})
	.catch((err) => {
		res.status(200).json({error: 'User not found'})
	})
}

exports.testPortfolios = function(req, res, next) {
  var data = req.body;
  return User.findOneAsync({email:data.email})
  .then((user) => {
    return user.addPortfolio(data.name, data.universe, data.fiscal_type, data.protection)
    .then((updatedUser) => {
      return seeNewUser(user.email)
      .then((upUser) => {
        console.log("********");
        console.log(upUser);
        res.send(upUser)
      })
      .catch((updatedError) => {
        console.log(updatedError);
        res.status(500).json(updatedError);
      })
    })
    .catch((portfolioError) => {
      console.log(portfolioError);
      res.status(500).json(portfolioError);
    })
  })
  .catch((err) => {
    res.status(200).json({error: 'User not found'})
  })
}

exports.addBank = function(req, res, next) {
  console.log("adding bank account");
  var data = req.body;
  console.log(req.session.user.email);
  var user = req.session.user;
  return User.findOneAsync({email:user.email})
  .then((user) => {
    return user.addBank(data.bank, data.iban, data.swift, data.fullName)
    .then((updatedUser) => {
      return seeNewUser(user.email)
      .then((upUser) => {
        console.log("********");
        console.log(upUser);
        req.session.user = upUser;
        req.session.notification = "Votre compte bancaire a bien été ajouté !";
        res.redirect('/app')
      })
      .catch((updatedError) => {
        console.log(updatedError);
        res.status(500).json(updatedError);
      })
    })
    .catch((portfolioError) => {
      console.log(portfolioError);
      res.status(500).json(portfolioError);
    })
  })
  .catch((err) => {
    console.log(err);
    res.status(200).json({error: 'User not found'})
  })
}

exports.addBankTest = function(req, res, next) {
  console.log("adding bank account");
  var data = req.body;
  console.log(data.email);
  return User.findOneAsync({email:data.email})
  .then((user) => {
    return user.addBank(data.bank, data.iban, data.swift, data.fullName)
    .then((updatedUser) => {
      return seeNewUser(user.email)
      .then((upUser) => {
        console.log("********");
        console.log(upUser);
        req.session.user = upUser;
        req.session.notification = "Banque ajoutée";
        res.redirect('/app')
      })
      .catch((updatedError) => {
        console.log(updatedError);
        res.status(500).json(updatedError);
      })
    })
    .catch((portfolioError) => {
      console.log(portfolioError);
      res.status(500).json(portfolioError);
    })
  })
  .catch((err) => {
    console.log(err);
    res.status(200).json({error: 'User not found'})
  })
}

function checkEmail(email) {
  return User.findOneAsync({email:email})
  .then(() => {
    
  })
}

function seeNewUser(email) {
  return User.findOneAsync({email:email})
}
exports.seeNewUser = seeNewUser;

exports.setPortfolio = function(email, id) {
	return User.findOneAsync({email:email})
	.then((user) => {
		return user.setPortfolio(id);
	})
	.catch((err) => {
		console.log(err);s
		return bluebird.Promise.reject(err);
	})
}

exports.getUsers = function(req, res, next) {
  let csvString = "emails;protection;value\n"
  let totalProtections = []
  let totalAmounts = []
  let totalUsers = []
  return User.findAsync()
  .then((users) => {
    const newUsers = users.map((us) => {
      let portfolioObject = us.portfolios.map((portfol) => {
        const protectionLevel = portfol._id.protection_level
        const netAssetValue = portfol._id.net_asset_value
        const placeIndex = totalProtections.indexOf(protectionLevel)
        if (placeIndex == (-1)) {
          totalProtections.push(protectionLevel)
          totalAmounts.push(netAssetValue)
          totalUsers.push([us.email])
        } else {
          totalAmounts[placeIndex] += netAssetValue
          let currentUsers = totalUsers[placeIndex]
          // console.log(currentUsers);
          currentUsers.push(us.email)
          totalUsers[placeIndex] = currentUsers
        }
      })
    })

    let returnedObject = totalProtections.map((el,i) => {
      csvString += totalUsers[i].join(",")+";"+el+";"+totalAmounts[i]+"\n"
    })

    let filePath = __dirname+'/aum.csv'

    fs.writeFile(filePath, csvString, (err) => {
      if (err) throw err;
      console.log('It\'s saved!');
      res.sendFile(filePath,"aum.csv")
    });
    // res.send(newUsers)
  })
}

exports.forgotAccount = (req, res, next) => {

  const email = req.body.email
  console.log("got email: "+email);
  return User.findOneAsync({email})
  .then((user) => {

      console.log("Found user");
      console.log(user);
      var token = randtoken.generate(128);
      user.token = token
      return user.saveAsync()
      .then(() => {
        return resetPassword(email, token)
        .then(() => {
          res.render('forgot', {layout:'login',ok:'Vous recevrez un email prochainement avec un lien de réactivation'});
        })
      })
      .catch((err) => {
        console.log(err);
        res.render('forgot', {layout:'login',err:'Une erreur est survenue, veuillez réessayer'});
      })
  })
  .catch((err) => {
    console.log(err);
    res.render('forgot', {layout:'login',err:'Une erreur est survenue, veuillez réessayer'});
  })


}

exports.resetAccount = function(req, res) {
  var token = req.query.token || null;
  console.log("got token "+token);
  if (null) {
    res.status(200).json({error: 'No valid token specified'})
  } else {
    return User.findOneAsync({token})
    .then((user) => {
      if (user) {
        console.log(user);
        console.log("got token for user "+user.email);
        res.render('reset', {layout:'login',token});
      } else {
        res.status(200).json({error: 'No valid token specified'})
      }
    })
  }
}

exports.checkResetAccount = function(req, res) {
  const data = req.body;
  const token = data.token,
        password = data.password;
  return User.findOneAsync({token})
    .then((user) => {
      if (user) {
        console.log(user);
        console.log("got token for user "+user.email+", setting new password");
        user.password = password
        return user.saveAsync()
        .then(() => {
          res.render('start', {layout:'login',ok:"Votre mot de passe est mis à jour"});
        })
      } else {
        res.status(200).json({error: 'No valid token specified'})
      }
    })
}











