var mongoose = require('mongoose');

var adSchema = mongoose.Schema({
    post: String,
    action: String, // share, post
    criteria: {
      filter: String, // ALL, FRIENDS_ONLY (users), FOLLOWERS_ONLY (stores)
      pages: [], // ALL or ids
      users: [], // ALL or ids
      gender: String, // all, male, women
      joinedAt: Date //
    },
    sentAt: Date
});

var Ad = mongoose.model('Ad', adSchema);

module.exports = Ad;
