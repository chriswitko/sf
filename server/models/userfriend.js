var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userfriendSchema = mongoose.Schema({
    friend: String,
    user: String,
    isMuted: {type: Boolean, default: false}
});

var UserFriend = mongoose.model('UserFriend', userfriendSchema);

module.exports = UserFriend;
