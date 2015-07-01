var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userpageSchema = mongoose.Schema({
    page: String,
    user: String
});

var UserPage = mongoose.model('UserPage', userpageSchema);

module.exports = UserPage;
