var config = require('./server/config/config.js');
var MC = require('mongomq').MongoConnection;
var MQ = require('mongomq').MongoMQ;

var options = {databaseName: config.db_name, queueCollection: 'capped_collection', autoStart: false};
//var options = {servers: ['ndcsrvcdep601', 'ndcsrvcdep602'], databaseName: 'tests', queueCollection: 'capped_collection', autoStart: false};

var mq = module.exports = new MQ(options);

// var express = require('express');
// var app = express();


// app.get('/add', function (req, res) {
//   console.log('Emitting: ' + req.query.user);
//   mq.emit('test', {name: req.query.user});
//   // recordNumber++;

//   res.send('Hello World! ' + req.query.user);
// });


// var server = app.listen(4000, function () {

//   var host = server.address().address;
//   var port = server.address().port;

//   console.log('Example app listening at http://%s:%s', host, port);

// });

// var recordNumber = 0;
// var putRecord = function(){
//   console.log('Emitting: '+recordNumber);
//   mq.emit('test', recordNumber);
//   recordNumber++;
//   setTimeout(putRecord, 5);
// };

(function(){
  var logger = new MC(options);
  logger.open(function(err, mc){
    if(err){
      console.log('ERROR: ', err);
    }else{
      mc.collection('log', function(err, loggingCollection){
        loggingCollection.remove({},  function(){
          mq.start(function(err){
            if(err){
              console.log(err);
            }
          });
        });
      });
    }
  });
})();
