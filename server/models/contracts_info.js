// grab the things we need
var mongoose = require('mongoose'),
    BaseModel = require('./basemodel'),
    autopopulate = require('mongoose-autopopulate'),
    bluebird = require('bluebird');

bluebird.promisifyAll(mongoose);

// create a schema
var contractsSchema = new BaseModel({
  user_id : { type: Number, ref: 'User', autopopulate : true },
  portfolio_id : { type : Number, ref: 'Portfolio', autopopulate : true },
  redemption_date : { type: Date, default : null }
});

contractsSchema.plugin(autopopulate);

bluebird.promisifyAll(contractsSchema.statics);
bluebird.promisifyAll(contractsSchema.methods);
bluebird.promisifyAll(contractsSchema);

var contractModel = mongoose.model('Contracts_Info', contractsSchema);
bluebird.promisifyAll(contractModel);

module.exports = contractModel;
