// grab the things we need
var mongoose = require('mongoose'),
    BaseModel = require('./basemodel'),
    autoIncrement = require('mongoose-auto-increment'),
    autopopulate = require('mongoose-autopopulate'),
    bluebird = require('bluebird'),
    Schema = mongoose.Schema;

bluebird.promisifyAll(mongoose);

var connection = mongoose.createConnection(process.env.MONGOURL);
autoIncrement.initialize(connection);

// create a schema
var ttransactionsSchema = new BaseModel({
  user_id : { type: Number, ref: 'User', autopopulate : true },
  portfolio_id : { type : Number, ref: 'Portfolio', autopopulate : true },
  transaction_id : { type : Number, required : true},
  quantity : { type : Number, required : true }, //positive or negative
  deposit_type : { type: String, default: null},
  universe : { type: Schema.Types.Mixed, required : true }, //{ protection, investment_universe, type}
  treated_date : { type : Number, default : null },
  status : { type : String, default : false },
  //id transaction id auto_increment
});

ttransactionsSchema.plugin(autopopulate);

ttransactionsSchema.plugin(autoIncrement.plugin, { model: 'Treated_Transactions', field: 'group_id' });
ttransactionsSchema.plugin(autopopulate);

bluebird.promisifyAll(ttransactionsSchema.statics);
bluebird.promisifyAll(ttransactionsSchema.methods);
bluebird.promisifyAll(ttransactionsSchema);

var ttranModel = mongoose.model('Treated_Transactions', ttransactionsSchema);
bluebird.promisifyAll(ttranModel);

module.exports = ttranModel;
