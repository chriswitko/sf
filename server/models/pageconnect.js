var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// connection between stores & brands

var pageconnectSchema = mongoose.Schema({
    page: String,
    brand: String
});

var PageConnect = mongoose.model('UserPage', pageconnectSchema);

module.exports = PageConnect;
