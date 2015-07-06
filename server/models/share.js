var mongoose = require('mongoose');

var shareSchema = mongoose.Schema({
  post: String,
  user: String,
  friend: String
});

var Share = mongoose.model('Share', shareSchema);

module.exports = Share;
