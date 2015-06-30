"use strict";

var config = require('../config/config.js');
var env = process.env.NODE_ENV || 'development';
var graph = require('fbgraph');

// var secrets = require('../config/secrets')[env];
var User = require('../models/user');
// var querystring = require('querystring');
// var validator = require('validator');
var async = require('async');
// var cheerio = require('cheerio');
// var request = require('request');
// var graph = require('fbgraph');
var _ = require('lodash');

var MC = require('mongomq').MongoConnection;
var MQ = require('mongomq').MongoMQ;
var mq_options = {databaseName: config.db_name, queueCollection: 'capped_collection', autoStart: false};
var mq = new MQ(mq_options);

// var Children = require('../common/child');
// var listener = Children.startChild('./listener');

graph.setVersion('2.3');

// var errors = [];

exports.importLikes = function(req, res) {
  var likes = [];

  // graph.setAccessToken(req.query.accessToken);

  // graph.get('/' + req.query.userID + '/likes?limit=100&fields=id,category,name,updated_time,picture,bio,cateogry_list,contact_address,cover,current_location,description,emails,general_info,link,phone,username,website,likes' + (req.query.after ? '&after=' + req.query.after : ''), function(err, output) {
  //   console.log('err', err);
  //   console.log('output', output);
  //   likes = output.data;
  //   res.json({status: 'success', data: likes, total: likes.length, next: (output.paging ? output.paging.cursors.after : '')});
  // });
  mq.emit('Q_importAllLikesPerUser', {userID: req.query.userID, accessToken: req.query.accessToken, after: ''});
  res.json({status: 'success'});
}

exports.authenticate = function(req, res) {
  var user = null;

  // console.log('post', req.body);

  graph.setAccessToken(req.body.accessToken);

  // ?fields=id,gender,fullname,first_name,last_name,email

  async.series({
    getUser: function(done) {
      graph.get('/me?fields=email,first_name,gender,id,last_name,link,locale,name,updated_time,picture,location', function(err, output) {
        console.log('output', req.body);

        User.findOne({fbId: output.id}, function(err, me) {
          if(!me) {
            user = new User();
          } else {
            user = me;
          }

          user.email = output.email;
          user.first_name = output.first_name;
          user.fbId = output.id;
          user.last_name = output.last_name;
          user.link = output.link;
          user.locale = output.locale;
          user.name = output.name;
          user.updated_time = output.updated_time;
          user.accessToken = req.body.accessToken;
          user.signedRequest = req.body.signedRequest;
          if(output.gender) user.gender = output.gender;
          if(output.picture) user.picture = output.picture.data.url;
          if(output.location) user.location = output.location.name;

          done();
        });
      });
    },
    queueImportLikes: function(done) {
      console.log('isNew');
      if(user.isNew) {
        console.log('CREATE QUEUE TO IMPORT LIKES');
      }
      done();
    },
    getLongLifeAccessToken: function(done) {
      graph.get('/oauth/access_token?redirect_uri=http://localhost:3000&grant_type=fb_exchange_token&client_id=' + config.facebook.clientID + '&client_secret=' + config.facebook.clientSecret + '&fb_exchange_token=' + req.body.accessToken, function(err, token) {
        if(token.access_token) user.accessToken = token.access_token;
        done();
      });
    },
    updateUser: function(done) {
      user.save(function() {
        done();
      });
    }
  }, function() {
    res.json({status: 'success', data: user});
  })

};

exports.getApi = function(req, res) {
  res.json({status: 'success'});
};

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
