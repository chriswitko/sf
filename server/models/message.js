var mongoose = require('mongoose');

var messageSchema = mongoose.Schema({
  ad: String,
  post: String,
  page: String,
  user: String,
  stats: {
    openAt: Date,
    openLocation: String, // notification (direct), inbox (manual)
    actionName: String, // save, remove, custom
    actionAt: Date
  }
});

var Message = mongoose.model('Message', messageSchema);

module.exports = Message;
