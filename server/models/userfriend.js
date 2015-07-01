var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userfriendSchema = mongoose.Schema({
    friend: String,
    user: String
});

var UserFriend = mongoose.model('UserFriend', userfriendSchema);

module.exports = UserFriend;
