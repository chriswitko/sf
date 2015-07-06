var mongoose = require('mongoose');

var postSchema = mongoose.Schema({
    fbId: String,
    page: String,
    message: String,
    created_time: Date,
    picture: String,
    full_picture: String,
    link: String,
    type: String,
    likes: [],
    og: {},
    action: {
      action: String, // internal cmd like: save, get, buy
      link: String,
      cta: String
    },
    validTo: Date,
    isVerified: {type: Boolean, default: false},
    isEnabled: {type: Boolean, default: true},
    isProduct: {type: Boolean, default: false},
    isPremium: {type: Boolean, default: false},
    isRTU: {type: Boolean, default: false}
});

var Post = mongoose.model('Post', postSchema);

module.exports = Post;
