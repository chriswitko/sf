var mongoose = require('mongoose');

var pageSchema = mongoose.Schema({
    fbId: String,
    internal_category: String,
    category: String,
    created_time: Date,
    updated_time: Date,
    name: String,
    picture: [],
    emails: [],
    category_list: [],
    contact_address: String,
    cover: [],
    link: String,
    current_location: String,
    location: {},
    accessToken: String,
    signedRequest: String,
    description: String,
    general_info: String,
    phone: String,
    username: String,
    website: String,
    likes: Number,
    admins: [],
    lastFlashMessageAt: Date,
    plan: {type: String, default: 'FREE'},
    isStore: {type: Boolean, default: false},
    isBrand: {type: Boolean, default: false},
    isVerified: {type: Boolean, default: false}, // means, that this is store by category or by business
    isEnabled: {type: Boolean, default: true},
    isActivated: {type: Boolean, default: false},
    isRTU: {type: Boolean, default: false}
});

var Page = mongoose.model('Page', pageSchema);

module.exports = Page;
