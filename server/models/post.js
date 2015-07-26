var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

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
    format: {type: String, default: 'post'}, // post, product, notification, sale
    isPremium: {type: Boolean, default: false},
    isRTU: {type: Boolean, default: false}
});

postSchema.plugin(mongoosePaginate);
var Post = mongoose.model('Post', postSchema);

module.exports = Post;
