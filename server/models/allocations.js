// grab the things we need
var mongoose = require('mongoose'),
    BaseModel = require('./basemodel'),
    bluebird = require('bluebird');

bluebird.promisifyAll(mongoose);

// create a schema
var allocationsSchema = new BaseModel({
  "Milvus protection" : { type: Number, required: true },
  "Milvus strategy" : { type: Number, required: true },
  "Part" : { type: Number, required: true },
	"Actif" : { type: String, required: true },
	"Continent" : { type: String, required: true },
	"Region / Pays" : { type: String, required: true },
	"Secteur /Type" : { type: String, required: true },
	"Index" : { type: String, required: true }
});

bluebird.promisifyAll(allocationsSchema.statics);
bluebird.promisifyAll(allocationsSchema.methods);
bluebird.promisifyAll(allocationsSchema);

var allocationsModel = mongoose.model('Allocations', allocationsSchema);
bluebird.promisifyAll(allocationsModel);

module.exports = allocationsModel;
