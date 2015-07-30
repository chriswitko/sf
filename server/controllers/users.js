"use strict";

var config = require('../config/config.js');
var env = process.env.NODE_ENV || 'development';
var graph = require('fbgraph');

var User = require('../models/user');
var UserPage = require('../models/userpage');
var Page = require('../models/page');
var Post = require('../models/post');
var async = require('async');
var _ = require('lodash');

var monq = require('monq');
var client = monq(process.env.MONGODB_URI || config.db, { safe: true });
var queue = client.queue('sna_default');

graph.setVersion('2.3');

var getUser = function(userID, id, cb) {
  User.findOne({fbId: userID, _id: id}, function(err, me) {
    if(!me) {
      cb(false);
    } else {
      cb(me);
    }
  });
}

exports.validateToken = function(req, res) {
  // /debug_token?input_token=CAAUbE6b5y7QBADyjcoxqctVnry9rJBXq2TZATRw0SEAGP3mtNATmZCjUQbFKhnMFq20uzZCgLXLMK15NqLlTBM7YDGqs3ZBFGi6Xrh4VDmcItSk2h2DCIl1cht0iWG4iqgqjM9ri8jkH9a9rx2f6DIyVa3IFWxONF3T40PIuKVmsNik18pomzZA3U3iVqStsZD&access_token=503652836467629|d273b14b2880c092212dfddaa878f375
  // {
  //    "data": {
  //       "app_id": "503652836467629",
  //       "application": "ShopNow - Local Test",
  //       "expires_at": 1440936348,
  //       "is_valid": true,
  //       "issued_at": 1435752348,
  //       "scopes": [
  //          "user_location",
  //          "user_likes",
  //          "user_friends",
  //          "email",
  //          "public_profile"
  //       ],
  //       "user_id": "1119171044763213"
  //    }
  // }
  // Sun, 30 Aug 2015 12:05:48 GMT
  // https://graph.facebook.com/oauth/access_token_info?client_id=APPID&access_token=xxxxxxxxx
  res.json({status: 'success'});
}

exports.importPosts = function(req, res, next) {
  var appToken = config.facebook.clientID + '|' + config.facebook.clientSecret;
  queue.enqueue('Q_importAllPostsPerPage', {pageID: req.query.pageID, accessToken: appToken, after: ''}, function (err, job) {
    if(err) { next(err); }
    console.log('Enqueued:', job.data);
    res.json({status: 'success'});
  });
}

exports.importPostsBulk = function(req, res, next) {
  var appToken = config.facebook.clientID + '|' + config.facebook.clientSecret;
  queue.enqueue('Q_importAllPostsPerPageBulk', {pageID: req.query.pageID, accessToken: appToken, after: ''}, function (err, job) {
      if(err) { next(err); }
      console.log('Enqueued:', job.data);
      res.json({status: 'success'});
  });
}

exports.posts = function(req, res, next) {
  var pageIds = [];
  var output = [];
  var page = req.query.page || 1;
  var limit = req.query.limit || 30;
  var user = {};
  var query;

  async.series({
    getUser: function(done) {
      getUser(req.query.userID, req.query.token, function(me) {
        if(!me) { next(new Error('User not found')); }
        user = me;
        console.log('user', user);
        done();
      });
    },
    getAllPageIds: function(done) {
      UserPage.find({user: user.fbId}, function(err, pages) {
        pageIds = _.map(pages, function(page) {return page.page});
        done();
      });
    },
    getPagesDetails: function(done) {
      query = {page: {$in: pageIds}, isVerified: true, isEnabled: true};
      if(req.query.after) query.created_time = {$gte: req.query.after};

      Post.paginate(query, {page: page, limit: limit, sortBy: {created_time: -1}}, function(err, posts) {
        output = posts;
        done();
      });
    }
  }, function() {
    res.json({status: 'success', data: output});
  })
}

// exports.pages = function(req, res) {
//   var pageIds = [];
//   var output = [];

//   async.series({
//     getAllPageIds: function(done) {
//       UserPage.find({user: req.query.userID}, function(err, pages) {
//         pageIds = _.map(pages, function(page) {return page.page});
//         done();
//       });
//     },
//     getPagesDetails: function(done) {
//       Page.find({fbId: {$in: pageIds}, isVerified: true, isEnabled: true}, {id: 1, fbId: 1, name: 1, picture: 1, plan: 1, internal_category: true}, function(err, pages) {
//         output = pages;
//         done();
//       });
//     }
//   }, function() {
//     res.json({status: 'success', data: output});
//   })
// }

exports.pages = function(req, res, next) {
  var accounts = [];
  var pages = [];
  var output = [];
  var ids = [];
  var fields = 'id,category,name,updated_time,created_time,picture,bio,category_list,contact_address,cover,current_location,description,emails,general_info,link,phone,username,website,likes';
  var user = {};

  async.series({
    getUser: function(done) {
      getUser(req.query.userID, req.query.token, function(me) {
        if(!me) { next(new Error('User not found')); }
        user = me;
        console.log('user', user);
        done();
      });
    },
    getPagesByAdmin: function(done) {
      Page.find({isActivated: true}, function(err, pages) { // , admins: {$in: [req.query.userID]}
        if(!pages) {
          return done();
        }
        ids = _.map(pages, function(item) {
          return item.fbId;
        });
        console.log('ids', ids);
      });
      done();
    },
    getPagesFromGraph: function(done) {
      graph.setAccessToken(user.accessToken);

      graph.get('/' + user.fbId + '/accounts?limit=100' + (fields ? '&fields=' + fields : '') + (req.query.after ? '&after=' + req.query.after : ''), function(err, data) {
        console.log('err', err);
        console.log('output', data);
        if(data.data) accounts = data.data;
        output = _.map(accounts, function(item) {
          if(ids.indexOf(item.id) > -1) {
            item.isActivated = true;
          } else {
            item.isActivated = false;
          }
          return item;
        });
        done();
      });
    }
  }, function() {
    res.json({status: 'success', data: output, total: output.length});
  })
}

exports.friends = function(req, res, next) {
  var friends = [];
  var fields = 'id,name,picture,link';

  var user = {};
  var output = {};

  async.series({
    getUser: function(done) {
      getUser(req.query.userID, req.query.token, function(me) {
        console.log('me', me);
        if(!me) { next(new Error('User not found')); }
        user = me;
        console.log('user', user);
        done();
      });
    },
    getData: function(done) {
      graph.setAccessToken(user.accessToken);

      graph.get('/' + user.fbId + '/friends?limit=100' + (fields ? '&fields=' + fields : '') + (req.query.after ? '&after=' + req.query.after : ''), function(err, output) {
        console.log('err', err);
        console.log('output', output);
        if(output.data) friends = output.data;
      });
    }
  }, function() {
    res.json({status: 'success', data: friends, total: friends.length});
  })
}

exports.importFriends = function(req, res, next) {
  var user = {};
  var output = {};

  async.series({
    getUser: function(done) {
      getUser(req.query.userID, req.query.token, function(me) {
        if(!me) { next(new Error('User not found')); }
        user = me;
        console.log('user', user);
        done();
      });
    },
    Q_importAllFriendsPerUser: function(done) {
      queue.enqueue('Q_importAllFriendsPerUser', {userID: user.fbId, accessToken: user.accessToken, after: ''}, function (err, job) {
        if(err) { next(err); }
        output = job;
        console.log('Enqueued:', job.data);
        done();
      });
    }
  }, function() {
    res.json({status: 'success'});
  })
}

exports.importLikes = function(req, res, next) {
  var user = {};
  var output = {};

  async.series({
    getUser: function(done) {
      getUser(req.query.userID, req.query.token, function(me) {
        if(!me) { next(new Error('User not found')); }
        user = me;
        console.log('user', user);
        done();
      });
    },
    Q_importAllLikesPerUser: function(done) {
      queue.enqueue('Q_importAllLikesPerUser', {userID: user.fbId, accessToken: user.accessToken, after: ''}, function (err, job) {
        if(err) { next(err); }
        output = job;
        console.log('Enqueued:', job.data);
        done();
      });
    }
  }, function() {
    res.json({status: 'success'});
  })
}

// TODO: After authorize (isNew = true) send notifications to all my existing friends
exports.authenticate = function(req, res) {
  var user = null;

  graph.setAccessToken(req.body.accessToken);

  console.log('auth', req.body);

  async.series({
    getUser: function(done) {
      graph.get('/me?fields=email,first_name,gender,id,last_name,link,locale,name,updated_time,picture,location', function(err, output) {
        User.findOne({fbId: req.body.userID}, function(err, me) {
          if(!me) {
            console.log('AS NEW');
            user = new User();
          } else {
            console.log('AS OLD');
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
      graph.get('/oauth/access_token?redirect_uri=' + config.host + '&grant_type=fb_exchange_token&client_id=' + config.facebook.clientID + '&client_secret=' + config.facebook.clientSecret + '&fb_exchange_token=' + req.body.accessToken, function(err, token) {
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
