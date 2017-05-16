// grab the things we need
var mongoose = require('mongoose'),
    BaseModel = require('./basemodel'),
    autopopulate = require('mongoose-autopopulate'),
    bluebird = require('bluebird');

bluebird.promisifyAll(mongoose);

// create a schema
var strategySchema = new BaseModel({
  dat : String,
  100 : Number,
  95 : Number,
  90 : Number,
  85 : Number,
  80 : Number,
  70 : Number,
  60 : Number,
  50 : Number,
  40 : Number,
  30 : Number,
  20 : Number,
  10 : Number,
  0 : Number
});

strategySchema.plugin(autopopulate);

bluebird.promisifyAll(strategySchema.statics);
bluebird.promisifyAll(strategySchema.methods);
bluebird.promisifyAll(strategySchema);

var stratModel = mongoose.model('Stats', strategySchema);
bluebird.promisifyAll(stratModel);

module.exports = stratModel;
