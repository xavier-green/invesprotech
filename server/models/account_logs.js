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
var accountsSchema = new BaseModel({
  user_id : { type: Number, ref: 'User', autopopulate : true},
  change : { type: Schema.Types.Mixed, required : true}
});

accountsSchema.plugin(autoIncrement.plugin, 'Account_Logs');
accountsSchema.plugin(autopopulate);

bluebird.promisifyAll(accountsSchema.statics);
bluebird.promisifyAll(accountsSchema.methods);
bluebird.promisifyAll(accountsSchema);

var accountModel = mongoose.model('Account_Logs', accountsSchema);
bluebird.promisifyAll(accountModel);

module.exports = accountModel;
