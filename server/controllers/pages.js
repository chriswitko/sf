"use strict";

var config = require('../config/config.js');
var env = process.env.NODE_ENV || 'development';
var graph = require('fbgraph');

var User = require('../models/user');
// var Page = require('../models/page');
var async = require('async');
var _ = require('lodash');

// var MC = require('mongomq').MongoConnection;
// var MQ = require('mongomq').MongoMQ;
// var mq_options = {databaseName: config.db_name, queueCollection: 'capped_collection', autoStart: false};
// var mq = new MQ(mq_options);

graph.setVersion('2.3');

exports.importPosts = function(req, res) {
  // mq.emit('Q_importAllPostsPerPage', {pageID: req.query.businessID, accessToken: req.query.accessToken, after: ''});
  res.json({status: 'success'});
}

// (function(){
//   var logger = new MC(mq_options);
//   logger.open(function(err, mc){
//     if(err){
//       console.log('ERROR: ', err);
//     }else{
//       mc.collection('log', function(err, loggingCollection){
//         loggingCollection.remove({},  function(){
//           mq.start(function(err){
//             if(err){
//               console.log(err);
//             }
//           });
//         });
//       });
//     }
//   });
// })();
