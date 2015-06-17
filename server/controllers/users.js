"use strict";

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

exports.authenticate = function(req, res) {
  var user = null;

  // console.log('post', req.body);

  graph.setVersion('2.3');
  graph.setAccessToken(req.body.accessToken);

  // ?fields=id,gender,fullname,first_name,last_name,email

  async.series({
    getUser: function(done) {
      graph.get('/me?fields=email,first_name,gender,id,last_name,link,locale,name,updated_time,picture,location', function(err, output) {
        console.log('output', output);

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
        user.accessToken = token.access_token;
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

