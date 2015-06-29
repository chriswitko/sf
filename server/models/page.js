var mongoose = require('mongoose');

var pageSchema = mongoose.Schema({
    fbId: String,
    category: String,
    updated_time: String,
    name: String,
    picture: String,
    cateogry_list: String,
    contact_address: String,
    cover: String,
    link: String,
    current_location: Date,
    accessToken: String,
    signedRequest: String,
    description: String,
    emails: String,
    general_info: String,
    phone: String,
    username: String,
    website: String,
    likes: Number,
    admins: [],
    plan: {type: String, default: 'FREE'},
    isEnabled: {type: Boolean, default: true},
    isRTU: {type: Boolean, default: false}
});

var Page = mongoose.model('Page', pageSchema);

module.exports = Page;
