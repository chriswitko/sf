var config = require('./server/config/config.js');
var MC = require('mongomq').MongoConnection;
var MQ = require('mongomq').MongoMQ;
// var queues = require('./server/controllers/queues');

var options = {databaseName: config.db_name, queueCollection: 'capped_collection', autoStart: false};
//var options = {servers: ['ndcsrvcdep601', 'ndcsrvcdep602'], databaseName: 'tests', queueCollection: 'capped_collection', autoStart: false};

var env = process.env.NODE_ENV || 'development';
var graph = require('fbgraph');

var extractor = require('unfluff');
var request = require('request');

var Page = require('./server/models/page');
var User = require('./server/models/user');
var UserPage = require('./server/models/userpage');
var UserFriend = require('./server/models/userfriend');
var Post = require('./server/models/post');

var async = require('async');
var _ = require('lodash');

//options.listenerType = 'streams';
//options.listenerType = 'nextObject';

//Streams are great for broadcast event listeners, they are BAD for things that require processing and response
// as they can allow for node saturation and they are greedy.  The default listenerType is 'nextObject', you
// can also set the listener type on the listener itself using:
//   MQ.on('event', {listenerType: ''}, callback) or
//   MQ.once('event', {listenerType: ''}, callback)

var mongoose = require('mongoose');

var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  mongoose.connect(config.db, options);
};
connect();

var mq = module.exports = new MQ(options);

var log;

var handleRecord = function(err, data, next){
  setTimeout(function() {
    var w = Math.floor(Math.random()*100);
    if(!err){
      console.log('data: ', data, 'wait: ', w);
      console.log('data', data);
      log.insert({handled: data}, {w:0});
    }else{
      console.log('err: ', err, 'wait: ', w);
    }
    next();
  }, 10000);
};


var approved_categories = ['Shopping & Retail', 'Clothing', 'Clothing Store', 'Bags/luggage', 'Home decor', 'Outdoor gear/sporting goods', 'Retail and consumer merchandise', 'Furniture', 'Shopping/retail', 'Bags/Luggage', 'Book Store', 'Health/Beauty', 'Home Decor', 'Home/Garden Website', 'Household Supplies', 'Jewelry/Watches', 'Local Business', 'Outdoor Gear/Sporting Goods', 'Retail and Consumer Merchandise', 'Shopping/Retail', 'Spas/Beauty/Personal Care'];
var approved_subcategories = ['Toy Store', 'Company', 'Shopping/Retail', "Men's Clothing Store", "Women's Clothing Store", 'Computers & Electronics', 'Bike Shop', 'Sporting Goods Store', 'Manufacturing', 'Clothing Store', 'Shoe Store'];

graph.setVersion('2.3');

// 30*24*60*60 = 2592000

var Q_importAllPostsPerPage = function(err, data, next) {
  var likes = [];
  var fields = 'id,from.fields(id,website),message,picture,full_picture,link,type,created_time,likes.fields(id,name,picture,link)';
  var since = Date.parse('-30 days');

  if(!err) {
    graph.setAccessToken(data.accessToken);

    graph.get('/' + data.pageID + '/feed?limit=100' + (since ? '&since=' + since : '') + (fields ? '&fields=' + fields : '') + (data.after ? '&after=' + data.after : ''), function(err, output) {
      console.log('err', err);
      console.log('-------------------');
      // console.log('output', output);
      likes = output.data;
      async.forEach(likes, function(item, cb) {
        if(item.type === 'link' || item.type === 'photo') {
          Q_addPost(null, {post: item}, function() {
            cb();
          });
        } else {
          cb();
        }
      }, function() {
        console.log('finito');
        // if(output.paging && output.paging.cursors.after) {
        //   console.log('after', output.paging ? output.paging.cursors.after : 'FIRST PAGE');
        //   Q_importAllFriendsPerUser(null, {userID: data.userID, accessToken: data.accessToken, after: output.paging.cursors.after}, null);
        // }
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

var Q_addPost = function(err, data, next) {
  var opengraph = {};
  if(!err) {
    async.series({
      verifyLink: function(done) {
        if(!data.post.link || !data.post.from.website) {
          return done();
        }
        console.log('>>> LINK', data.post.link);
        request( { method: "HEAD", url: data.post.link, followAllRedirects: true }, function (error, response) {
          data.post.link = response.request.href;
          // data.isProduct =
          console.log('website', data.post.from.website);
          console.log('data.post.link', data.post.link);
          data.post.isVerified = data.post.link.indexOf(data.post.from.website) > -1 ? true : false;
          done();
        });
      },
      getOpenGraph: function(done) {
        if(!data.post.link || !data.isVerified) {
          return done();
        }
        console.log('link', data.post.link);
        request(data.post.link, function (error, response, body) {
          data.post.og = extractor(body);
          console.log('opengraph', opengraph);
          done();
        })
      },
      updatePost: function(done) {
        data.post.fbId = data.post.id;

        delete data.post.id;
        data.post.page = data.post.from.id;

        Post.findOne({fbId: data.post.id}, function(err, post) {
          if(!post) {
            post = new Post(data.post);
          }

          post.save(function(err) {
            console.log('save page err', err);
            done();
          });
        });
      }
    }, function() {
      if(next) {
        next();
      }
    })
  } else {
    console.log('QUEUES_ERR: ', err);
    if(next) {
      next();
    }
  }
}

var Q_importAllFriendsPerUser = function(err, data, next) {
  var likes = [];
  var fields = 'id,name,picture,link';

  if(!err) {
    graph.setAccessToken(data.accessToken);

    graph.get('/' + data.userID + '/friends?limit=100' + (fields ? '&fields=' + fields : '') + (data.after ? '&after=' + data.after : ''), function(err, output) {
      console.log('err', err);
      console.log('-------------------');
      // console.log('output', output);
      likes = output.data;
      async.forEach(likes, function(item, cb) {
        Q_addFriend(null, {friendID: item.id, userID: data.userID}, function() {
          cb();
        });
      }, function() {
        console.log('finito');
        // if(output.paging && output.paging.cursors.after) {
        //   console.log('after', output.paging ? output.paging.cursors.after : 'FIRST PAGE');
        //   Q_importAllFriendsPerUser(null, {userID: data.userID, accessToken: data.accessToken, after: output.paging.cursors.after}, null);
        // }
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

var Q_addFriend = function(err, data, next) {
  var likes = [];
  if(!err) {
    UserFriend.findOne({friend: data.friendID, user: data.userID}, function(err, userfriend) {
      if(!userfriend) {
        userfriend = new UserFriend();
      }
      console.log('inside', data.id);
      userfriend.friend = data.friendID;
      userfriend.user = data.userID;

      userfriend.save(function(err) {
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

var Q_followPage = function(err, data, next) {
  var likes = [];
  if(!err) {
    UserPage.findOne({page: data.pageID, user: data.userID}, function(err, userpage) {
      if(!userpage) {
        userpage = new UserPage();
      }
      console.log('inside', data.id);
      userpage.page = data.pageID;
      userpage.user = data.userID;

      userpage.save(function(err) {
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
    Page.findOne({fbId: data.page.id}, function(err, page) {
      if(!page) {
        page = new Page();
      }
      console.log('inside', data.page.id);
      page.fbId = data.page.id;
      page.name = data.page.name;

      // console.log('before save', item.id);
      page.category = data.page.category;
      page.created_time = data.page.created_time;
      page.updated_time = data.page.updated_time;
      page.picture = data.page.picture;

      var category_list = _.pluck(_.flatten(data.page.category_list, true), 'name');

      page.category_list = category_list;

      page.contact_address = data.page.contact_address;
      page.cover = data.page.cover;
      page.link = data.page.link;
      page.current_location = data.page.current_location;
      page.description = data.page.description;
      page.general_info = data.page.general_info;
      page.phone = data.page.phone;
      page.username = data.page.username;
      page.website = data.page.website;
      page.likes = data.page.likes;

      page.isVerified = (approved_categories.indexOf(page.category) > -1 ? true: false);
      if(!page.isVerified) {
        _.each(page.category_list, function(subcategory) {
            if (approved_subcategories.indexOf(subcategory) > -1) {
              page.isVerified = true;
            }
        });
      }

      page.save(function(err) {
        console.log('save page err', err);
        Q_followPage(null, {pageID: page.fbId, userID: data.userID}, function() {
          next();
        });
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
        Q_addPage(null, {page: item, userID: data.userID}, function() {
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
exports.Q_followPage = Q_followPage;
exports.Q_importAllFriendsPerUser = Q_importAllFriendsPerUser;
exports.Q_addFriend = Q_addFriend;
exports.Q_importAllPostsPerPage = Q_importAllPostsPerPage;
exports.Q_addPost = Q_addPost;




mq.on('test', handleRecord);
mq.on('Q_importAllLikesPerUser', Q_importAllLikesPerUser);
mq.on('Q_importAllFriendsPerUser', Q_importAllFriendsPerUser);
mq.on('Q_addPage', Q_addPage);
mq.on('Q_activateUserFeed', Q_activateUserFeed);
mq.on('Q_importAllPostsPerPage', Q_importAllPostsPerPage);
mq.on('Q_addPost', Q_addPost);

(function(){
  var logger = new MC(options);
  logger.open(function(err, mc){
    if(err){
      console.log('ERROR: ', err);
    }else{
      mc.collection('log', function(err, loggingCollection){
        log = loggingCollection;
        mq.start(function(err){
          if(err){
            console.log(err);
          }
        });
      });
    }
  });
})();
