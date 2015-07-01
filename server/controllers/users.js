"use strict";

var config = require('../config/config.js');
var env = process.env.NODE_ENV || 'development';
var graph = require('fbgraph');

// var secrets = require('../config/secrets')[env];
var User = require('../models/user');
var UserPage = require('../models/userpage');
var Page = require('../models/page');
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

graph.setVersion('2.3');

exports.importPosts = function(req, res) {
  mq.emit('Q_importAllPostsPerPage', {pageID: req.query.pageID, accessToken: req.query.accessToken, after: ''});
  res.json({status: 'success'});
}

exports.pages = function(req, res) {
  var pageIds = [];
  var output = [];

  async.series({
    getAllPageIds: function(done) {
      UserPage.find({user: req.query.userID}, function(err, pages) {
        pageIds = _.map(pages, function(page) {return page.page});
        done();
      });
    },
    getPagesDetails: function(done) {
      Page.find({fbId: {$in: pageIds}, isVerified: true, isEnabled: true}, {id: 1, fbId: 1, name: 1, picture: 1, plan: 1, internal_category: true}, function(err, pages) {
        output = pages;
        done();
      });
    }
  }, function() {
    res.json({status: 'success', data: output});
  })
}

exports.friends = function(req, res) {
  var friends = [];
  var fields = 'id,name,picture,link';

  graph.setAccessToken(req.query.accessToken);

  graph.get('/' + req.query.userID + '/friends?limit=100' + (fields ? '&fields=' + fields : '') + (req.query.after ? '&after=' + req.query.after : ''), function(err, output) {
    console.log('err', err);
    console.log('output', output);
    friends = output.data;
    res.json({status: 'success', data: friends, total: friends.length});
  });
}

exports.importFriends = function(req, res) {
  mq.emit('Q_importAllFriendsPerUser', {userID: req.query.userID, accessToken: req.query.accessToken, after: ''});
  res.json({status: 'success'});
}

exports.importLikes = function(req, res) {
  mq.emit('Q_importAllLikesPerUser', {userID: req.query.userID, accessToken: req.query.accessToken, after: ''});
  res.json({status: 'success'});
}

// TODO: After authorize (isNew = true) send notifications to all my existing friends
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
