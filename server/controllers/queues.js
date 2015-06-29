"use strict";

var config = require('../config/config.js');

var env = process.env.NODE_ENV || 'development';
var graph = require('fbgraph');

var Page = require('../models/page');
var async = require('async');
var _ = require('lodash');

var MQ = require('mongomq').MongoMQ;
var mq_options = {databaseName: config.db_name, queueCollection: 'capped_collection', autoStart: false};
var mq = new MQ(mq_options);

graph.setVersion('2.3');

var log;

exports.importAllLikesPerUser = function(err, data, next) {
  var likes = [];
  if(!err) {
    graph.setAccessToken(data.accessToken);

    graph.get('/' + data.userID + '/likes?limit=100&fields=id,category,name,updated_time,picture,bio,cateogry_list,contact_address,cover,current_location,description,emails,general_info,link,phone,username,website,likes' + (data.after ? '&after=' + data.after : ''), function(err, output) {
      console.log('err', err);
      console.log('output', output);
      likes = output.data;
      console.log('likes', likes);
      next();
      // async.each(likes, function(item, cb) {
      //   page = new Page();
      //   page.fbId = item.id;
      //   page.name = item.name
      //   page.save(function() {
      //     cb();
      //   })
      // }, function() {
      //   next();
      // })
      // if(output.paging)
      // res.json({status: 'success', data: likes, total: likes.length, next: (output.paging ? output.paging.cursors.after : '')});
    });
  } else {
    console.log('err: ', err, 'wait: ', w);
    next();
  }
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
      graph.get('/oauth/access_token?redirect_uri=http://localhost:3000&grant_type=fb_exchange_token&client_id=1437146103270324&client_secret=90bb44bc8a3394099b075e5c0db73898&fb_exchange_token=' + req.body.accessToken, function(err, token) {
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

