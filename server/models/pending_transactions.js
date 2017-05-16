// grab the things we need
var mongoose = require('mongoose'),
    BaseModel = require('./basemodel'),
    autopopulate = require('mongoose-autopopulate'),
    autoIncrement = require('mongoose-auto-increment'),
    bluebird = require('bluebird'),
    Schema = mongoose.Schema;

bluebird.promisifyAll(mongoose);
var connection = mongoose.createConnection(process.env.MONGOURL);
autoIncrement.initialize(connection);

// create a schema
var ptransactionsSchema = new BaseModel({
  user_id : { type: Number, ref: 'User', index: true },
  portfolio_id : { type : Number, ref: 'Portfolio', autopopulate : true },
  quantity : { type : Number, required : true }, //positive or negative
  deposit_type : { type: String, default: null},
  universe : { type: Schema.Types.Mixed, required : true }, //{ protection, investment_universe, type}
  recurrency : { type: Schema.Types.Mixed, default : null }
});

ptransactionsSchema.plugin(autoIncrement.plugin, { model: 'Pending_Transactions', field: 'transaction_id' });
ptransactionsSchema.plugin(autopopulate);

bluebird.promisifyAll(ptransactionsSchema.statics);
bluebird.promisifyAll(ptransactionsSchema.methods);
bluebird.promisifyAll(ptransactionsSchema);

var ptranModel = mongoose.model('Pending_Transactions', ptransactionsSchema);
bluebird.promisifyAll(ptranModel);

module.exports = ptranModel;
