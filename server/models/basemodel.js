var mongoose = require('mongoose');
var timestamps = require('mongoose-timestamp');
var Schema = mongoose.Schema;

// Schéma par défaut dans tous les modèles avec les fields created_at et updated_at
function getNewSchema(opts) {
	var newSchema = new mongoose.Schema(opts);
	newSchema.plugin(timestamps);

	return newSchema;
}

module.exports = getNewSchema;
