"use strict";

var config = require('../config/config.js');

var env = process.env.NODE_ENV || 'development';
var graph = require('fbgraph');

var Page = require('../models/page');
var User = require('../models/user');

var async = require('async');
var _ = require('lodash');

var mongoose = require('mongoose');

var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  mongoose.connect(config.db, options);
};
connect();

// mongoose.connection.on('error', console.log);
// mongoose.connection.on('disconnected', connect);

var MC = require('mongomq').MongoConnection;
var MQ = require('mongomq').MongoMQ;
var mq_options = {databaseName: config.db_name, queueCollection: 'capped_collection', autoStart: false};
var mq = new MQ(mq_options);

graph.setVersion('2.3');

var Q_activateUserFeed = function(err, data, next) {
  User.findOne({fbId: data.userID}, function(err, user) {
    if(!user) {
      return next ? next() : true;
    }
    user.isFeedReady = true;
    user.save(function(err) {
      return next ? next() : true;
    });
  });
}

var Q_addPage = function(err, data, next) {
  var likes = [];
  if(!err) {
    Page.findOne({fbId: data.id}, function(err, page) {
      if(!page) {
        page = new Page();
      }
      console.log('inside', data.id);
      page.fbId = data.id;
      page.name = data.name;

      // console.log('before save', item.id);
      page.category = data.category;
      page.created_time = data.created_time;
      page.updated_time = data.updated_time;
      page.picture = data.picture;

      var category_list = _.pluck(_.flatten(data.category_list, true), 'name');

      page.category_list = category_list;

      page.contact_address = data.contact_address;
      page.cover = data.cover;
      page.link = data.link;
      page.current_location = data.current_location;
      page.description = data.description;
      page.general_info = data.general_info;
      page.phone = data.phone;
      page.username = data.username;
      page.website = data.website;
      page.likes = data.likes;

      page.save(function(err) {
        console.log('save page err', err);
        next();
      });
    });
  } else {
    console.log('QUEUES_ERR: ', err);
    if(next) {
      next();
    }
  }
}

var Q_importAllLikesPerUser = function(err, data, next) {
  var likes = [];
  if(!err) {
    graph.setAccessToken(data.accessToken);

    graph.get('/' + data.userID + '/likes?limit=100&fields=id,category,name,updated_time,created_time,picture,bio,category_list,contact_address,cover,current_location,description,emails,general_info,link,phone,username,website,likes' + (data.after ? '&after=' + data.after : ''), function(err, output) {
      console.log('err', err);
      console.log('-------------------');
      // console.log('output', output);
      likes = output.data;
      async.forEach(likes, function(item, cb) {
        Q_addPage(null, item, function() {
          cb();
        });
      }, function() {
        console.log('finito');
        if(output.paging && output.paging.cursors.after) {
          console.log('after', output.paging ? output.paging.cursors.after : 'FIRST PAGE');
          Q_importAllLikesPerUser(null, {userID: data.userID, accessToken: data.accessToken, after: output.paging.cursors.after}, null);
        } else {
          Q_activateUserFeed(null, {userID: data.userID}, null);
        }
        if(next) {
          next();
        }
      })
    });
  } else {
    console.log('QUEUES_ERR: ', err);
    if(next) {
      next();
    }
  }
}

exports.Q_importAllLikesPerUser = Q_importAllLikesPerUser;
exports.Q_addPage = Q_addPage;
// exports.Q_addPage = Q_addPage;

(function(){
  var logger = new MC(mq_options);
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
