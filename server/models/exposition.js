// grab the things we need
var mongoose = require('mongoose'),
    BaseModel = require('./basemodel'),
    bluebird = require('bluebird'),
    Schema = mongoose.Schema;

bluebird.promisifyAll(mongoose);

// create a schema
var expositionSchema = new BaseModel({
  univ_id : { type: String, required : true },
  date : { type: String, required : true },
  actif : { type: String, required : true},
  continent : { type: String, required : true},
  pays : { type: String, required : true},
  Sector : { type: String, required : true},
  indice : { type: String, required : true},
  poid : { type: Number, required : true},
  on_balance_sheet : { type: Number, required : true},
  off_balance_sheet : { type: Number, required : true}
});

bluebird.promisifyAll(expositionSchema.statics);
bluebird.promisifyAll(expositionSchema.methods);
bluebird.promisifyAll(expositionSchema);

var expoModel = mongoose.model('Expositions', expositionSchema);
bluebird.promisifyAll(expoModel);

module.exports = expoModel;
