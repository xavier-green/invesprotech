// grab the things we need
var mongoose = require('mongoose'),
    BaseModel = require('./basemodel'),
    autoIncrement = require('mongoose-auto-increment'),
    bluebird = require('bluebird'),
    Schema = mongoose.Schema;

bluebird.promisifyAll(mongoose);

var connection = mongoose.createConnection(process.env.MONGOURL);
autoIncrement.initialize(connection);

// create a schema
var portfolioSchema = new BaseModel({
  user_id : { type: Number },
  redemption_date : { type: Date, default : null },
  universe : { type: Number, required : true },//add strat id
  protection_level : { type: Number, required : true },
  net_asset_value : { type: Number, default : 0 },
  deposit_amount : { type: Number, default : null },
  net_asset_value_protected : { type: Number, default : 0 },
  fiscal_type : { type: String, required : true },
  deposit_frequency : { type: Schema.Types.Mixed, default : null },
  fake : { type: Boolean, default: true },
  name : { type:String, required: true}
});

portfolioSchema.plugin(autoIncrement.plugin, 'Portfolio');

bluebird.promisifyAll(portfolioSchema.statics);
bluebird.promisifyAll(portfolioSchema.methods);
bluebird.promisifyAll(portfolioSchema);

var portModel = mongoose.model('Portfolio', portfolioSchema);
bluebird.promisifyAll(portModel);

module.exports = portModel;
