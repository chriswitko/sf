var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userdeviceSchema = mongoose.Schema({
  user: String,
  deviceName: String,
  deviceId: String,
  pushtToken: String
});

var UserDevice = mongoose.model('UserDevice', userdeviceSchema);

module.exports = UserDevice;
