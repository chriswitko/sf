var mongoose = require('mongoose');

var adSchema = mongoose.Schema({
    post: String,
    action: String, // share, post
    criteria: {
      filter: String, // ALL, FRIENDS_ONLY (users), FOLLOWERS_ONLY (stores)
      posts: [], // posts liked by user, ANY or ids
      pages: [], // ALL or ids
      users: [], // ALL or ids
      gender: String, // all, male, women
      joinedAt: Date, //
      lastDiscountRequestAt: Date, // select users who recieved discount more then 1 month ago
      requestDiscount: {type: Boolean, default: false}
    },
    eventOn: String, // discount request, welcome message, post save, post reshare
    validTo: Date, // null if no limit
    publishStatus: String, // draft, published (queued)
    sentAt: Date
});

var Ad = mongoose.model('Ad', adSchema);

module.exports = Ad;
