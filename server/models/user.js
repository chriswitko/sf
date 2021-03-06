var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    email: String,
    first_name: String,
    gender: String,
    fbId: String,
    last_name: String,
    link: String,
    locale: String,
    name: String,
    updated_time: Date,
    accessToken: String,
    signedRequest: String,
    picture: String,
    location: String,
    platform: String, // iOS, Android
    lastExploreSeenAt: Date,
    lastDiscountsSeenAt: Date,
    messagesCounter: {type: Number, default: 0},
    isBusinessPartner: {type: Boolean, default: false},
    isEnabled: {type: Boolean, default: true},
    isFeedReady: {type: Boolean, default: false}
});

userSchema.method('toJSON', function() {
    var user = this.toObject();
    delete user.accessToken;
    delete user.signedRequest;
    delete user.__v;
    return user;
});

var User = mongoose.model('User', userSchema);

module.exports = User;
