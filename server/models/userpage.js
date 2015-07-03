var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userpageSchema = mongoose.Schema({
    page: String,
    user: String,
    isMuted: {type: Boolean, default: false}
});

var UserPage = mongoose.model('UserPage', userpageSchema);

module.exports = UserPage;
