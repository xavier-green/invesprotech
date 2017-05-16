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
var historySchema = new BaseModel({
  user_id : { type: Number, ref: 'User', autopopulate : true },
  portfolio_id : { type : Number, ref: 'Portfolio', autopopulate : true },
  date : { type : String, required : true},
  net_asset_value : { type : Number, required : true },
  protected_value : { type : Number, required : true },
});

historySchema.plugin(autopopulate);

historySchema.plugin(autoIncrement.plugin, 'Portfolio_history');

bluebird.promisifyAll(historySchema.statics);
bluebird.promisifyAll(historySchema.methods);
bluebird.promisifyAll(historySchema);

var historyModel = mongoose.model('Portfolio_history', historySchema);
bluebird.promisifyAll(historyModel);

module.exports = historyModel;
