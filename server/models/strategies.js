// grab the things we need
var mongoose = require('mongoose'),
    BaseModel = require('./basemodel'),
    bluebird = require('bluebird'),
    Schema = mongoose.Schema;

bluebird.promisifyAll(mongoose);

// create a schema
var strategySchema = new BaseModel({
  strat_id : { type: Number, required : true },
  date : { type: String, required : true },
  protection : { type : Number, required : true },
  rendement : { type: Number, required : true},
  univers_object : { type: Schema.Types.Mixed, required : true } // { univers1: 75%, univers2: 10%...}
});

bluebird.promisifyAll(strategySchema.statics);
bluebird.promisifyAll(strategySchema.methods);
bluebird.promisifyAll(strategySchema);

var stratModel = mongoose.model('Strategies', strategySchema);
bluebird.promisifyAll(stratModel);

module.exports = stratModel;
