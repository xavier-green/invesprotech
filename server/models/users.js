// grab the things we need
var mongoose = require('mongoose'),
    BaseModel = require('./basemodel'),
    autoIncrement = require('mongoose-auto-increment'),
    autopopulate = require('mongoose-autopopulate'),
    Portfolio = require('./portfolio'),
    AccountLog = require('./account_logs'),
    bluebird = require('bluebird'),
    bcrypt = require('bcrypt-nodejs'),
    _ = require('lodash');

bluebird.promisifyAll(mongoose);

var connection = mongoose.createConnection(process.env.MONGOURL);
autoIncrement.initialize(connection);

// create a schema
var userSchema = new BaseModel({
  profile : {
  	first_name : { type: String, required: true },
  	last_name : { type: String, required: true },
    sex : { type: String },
  	job_categ : { type: String },
  	family_situation : { type: String },
  	children : { type: Number },
  	age : { type: Number },
    revenue : { type: Number },
    epargne : { type: Number },
    patrimoine : { type: Array },
    pertes : { type: String },
    plan_possede : { type: Array }
  },
  legal : {
    cote : { type: Boolean, required: false, default: false },
    isf : { type: Boolean, required: false, default: false },
    expose : { type: Boolean, required: false, default: false },
    entourage_expose : { type: Boolean, required: false, default: false },
    done : { type: Boolean, required: false, default: false } 
  },
  bank : {
    activated : { type: Boolean, required: false, default: false },
    iban : { type: String, required: false, default: null},
    bankName : { type: String, required: false, default: null},
    swift : { type: String, required: false, default: null},
    fullname : { type: String, required: false, default: null}
  },
  numerics: {
    premier_versement : { type: Number, required: false, default: null},
    frequence_versement : { type: String, required: false, default: "monthly"},
    versement : { type: Number, required: false, default: null}
  },
  email: { type: String, required: true, index: {unique: true} },
  password: { type: String, required: true },
  phone : { type: String, required : true },
  secondary_phone : { type: String },
  address : { type: String },
  fiscal_type : { type: String, required : false },
  account_type : { type: Number, required : true }, //false = 0, real = 1
  activated : { type: Boolean, default : false },
  newsletter : { type: Boolean, default : false },
  portfolios : [{ _id: { type:Number, ref: 'Portfolio', autopopulate : true}, default: Boolean, name: String }],
  token : { type: String, required : true, index: true },
  protection_level : { type: Number, required : true },
  promo_code : { type : String }
});

userSchema.methods.comparePassword = function comparePassword(password, callback) {
  bcrypt.compare(password, this.password, callback);
};

userSchema.methods.addPortfolio = function createTestPortfolio(name, universe, fiscal_type, protection) {
  var self = this;
  var testPortfolio = new Portfolio({
    user_id : this._id,
    universe : universe,
    protection_level : protection,
    fiscal_type : fiscal_type,
    name : name
  });
  var copy = _.union([],self.portfolios);
  return bluebird.map(copy, (portfolio, i) => {
    copy[i]['default'] = false;
  })
  .then(() => {
		return testPortfolio.saveAsync()
  .then((testPort) => {
    console.log("portfolio created");
    var firstPortfolio = {
      _id : testPort._id,
      'default' : true,
      name: name
    }
    copy.push(firstPortfolio);
    self.portfolios = copy;
    return self.saveAsync();
  })
  .catch((err) => {
    console.log("There was an error adding the portfolio");
    console.log(err);
    return bluebird.Promise.reject("There was an error adding the portfolio");
  })
  })
  .catch((err) => {
    console.log("There was an error setting all to false");
    console.log(err);
    return bluebird.Promise.reject(err);
  })
}

userSchema.methods.addBank = function addBank(bankName, iban, swift, fullName) {
  this.bank.bankName = bankName;
  this.bank.iban = iban;
  this.bank.swift = swift;
  this.bank.activated = true;
  this.bank.fullname = fullName;
  return this.saveAsync()
}

userSchema.methods.setPortfolio = function setPortfolio(id) {
	var self = this;
	var copy = _.union([],self.portfolios);
  	return bluebird.map(copy, (portfolio, i) => {
  		if (copy[i]._id == id) {
  			copy[i]['default'] = true;
  		} else {
			copy[i]['default'] = false;
  		}
  	})
  	.then(() => {
  		self.portfolios = copy;
  		return self.saveAsync();
  	})
}

userSchema.methods.createTestPortfolio = function createTestPortfolio(universe, protection) {
  return this.addPortfolio('Portfolio Test Blanc', universe, this.fiscal_type, protection);
}

userSchema.methods.setRealPortfolio = function setRealPortfolio(newPortfolio) {
  var self = this;
  if (this.account_type == 1) {
    return bluebird.Promise.reject("Portfolio is already real");
  }
  var copy = _.union([],self.portfolios);
  return bluebird.map(copy, (portfolio, i) => {
    copy[i]['default'] = false;
  })
  .then(() => {
    copy.push(newPortfolio);
    self.portfolios = copy;
    self.account_type = 1;
    return self.logAccount(0,1)
    .then(() => {
      return self.saveAsync()
      .then((userSaved) => {
        return userSaved;
      })
      .catch((userSaveError) => {
        console.log(userSaveError);
        return bluebird.Promise.reject(userSaveError);
      })
    })
    .catch((logAccountError) => {
      console.log(logAccountError);
      return bluebird.Promise.reject(logAccountError);
    })
  })
  .catch((err) => {
    console.log("There was an error setting all to false");
    console.log(err);
    return bluebird.Promise.reject(err);
  })
}

userSchema.methods.logAccount = function logAccount(oldType, newType) {
  var accountLog = new AccountLog({
    user_id : this._id,
    change : {
      initial_type : oldType,
      current_type : newType
    }
  });
  return accountLog.saveAsync()
  .then((accntLog) => {
    return accntLog;
  })
  .catch((err) => {
    console.log("There was an error logging the account type change");
    console.log(err);
    return bluebird.Promise.reject("There was an error logging the account type change");
  })
}

userSchema.pre('save', function(next) {
  const user = this;
  if (!user.isModified('password')) {
    return next();
  }
  console.log("Salting password");
  return bcrypt.genSalt(10, (saltError, salt) => {
    if (saltError) { console.log(saltError);return next(saltError); }
    console.log("Generated salt");
    return bcrypt.hash(user.password, salt, null, (hashError, hash) => {
      if (hashError) { console.log(hashError);return next(hashError); }
      console.log("Hashed password");
      user.password = hash;
      return next();
    });
  });
});

userSchema.plugin(autoIncrement.plugin, 'User');
userSchema.plugin(autopopulate);

bluebird.promisifyAll(userSchema.statics);
bluebird.promisifyAll(userSchema.methods);
bluebird.promisifyAll(userSchema);

var userModel = mongoose.model('User', userSchema);
bluebird.promisifyAll(userModel);

module.exports = userModel;
