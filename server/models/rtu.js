var mongoose = require('mongoose');

var rtuSchema = mongoose.Schema({
  body: {},
  isProcessed: {type: Boolean, default: false},
  status: {type: String, default: 'NEW'},
  createdAt: { type: Date, default: Date.now }
});

var Rtu = mongoose.model('Rtu', rtuSchema);

module.exports = Rtu;
