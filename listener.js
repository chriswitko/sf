var config = require('./server/config/config.js');
// var MC = require('mongomq').MongoConnection;
// var MQ = require('mongomq').MongoMQ;
// var queues = require('./server/controllers/queues');

// var options = {databaseName: config.db_name, queueCollection: 'capped_collection', autoStart: false};
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

var cheerio = require('cheerio');
var opengraphServer = require('./server/helpers/opengraph');

process.setMaxListeners(0);

console.log('APP:ENV', env);

var mongoose = require('mongoose');

var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  mongoose.connect(config.db, options);
};
connect();

var approved_categories = ['Shopping & Retail', 'Clothing', 'Clothing Store', 'Bags/luggage', 'Home decor', 'Outdoor gear/sporting goods', 'Retail and consumer merchandise', 'Furniture', 'Shopping/retail', 'Bags/Luggage', 'Book Store', 'Health/Beauty', 'Home Decor', 'Home/Garden Website', 'Household Supplies', 'Jewelry/Watches', 'Local Business', 'Outdoor Gear/Sporting Goods', 'Retail and Consumer Merchandise', 'Shopping/Retail', 'Spas/Beauty/Personal Care'];
var approved_subcategories = ['Toy Store', 'Company', 'Shopping/Retail', "Men's Clothing Store", "Women's Clothing Store", 'Computers & Electronics', 'Bike Shop', 'Sporting Goods Store', 'Manufacturing', 'Clothing Store', 'Shoe Store'];

graph.setVersion('2.3');

var Q_importAllPostsPerPage = function(data, next) {
  var likes = [];
  var fields = 'id,from.fields(id,website),message,picture,full_picture,link,type,created_time,likes.fields(id,name,picture,link)';
  var since = Date.parse('-1 days');

  graph.setAccessToken(data.accessToken);

  graph.get('/' + data.pageID + '/posts?limit=1' + (since ? '&since=' + since : '') + (fields ? '&fields=' + fields : '') + (data.after ? '&after=' + data.after : ''), function(err, output) {
    likes = output.data;
    async.forEach(likes, function(item, cb) {
      if(item.type === 'link' || item.type === 'photo') {
        Q_addPost({post: item}, function() {
          cb();
        });
      } else {
        cb();
      }
    }, function() {
      if(next) {
        next(null, 'success');
      }
    })
  });
}

var Q_importAllPostsPerPageBulk = function(data, next) {
  var likes = [];
  var fields = 'posts.fields(id,from.fields(id,website),message,picture,full_picture,link,type,created_time,likes.fields(id,name,picture,link)).limit(1)';
  var since = Date.parse('-1 days');
  var query = '/?ids=' + data.pageID + (since ? '&since=' + since : '') + (fields ? '&fields=' + fields : '') + (data.after ? '&after=' + data.after : '');

  graph.setAccessToken(data.accessToken);

  graph.get(query, function(err, output) {
    likes = _.map(output, function(item) {return item.posts.data});
    async.forEach(likes, function(item, cb) {
      if(item.type === 'link' || item.type === 'photo') {
        Q_addPost({post: item}, function() {
          cb();
        });
      } else {
        cb();
      }
    }, function() {
      if(next) {
        next(null, 'success');
      }
    })
  });
}

var findUrls = function ( text ) {
  var source = (text || '').toString();
  var urlArray = [];
  var url;
  var matchArray;

  // Regular expression to find FTP, HTTP(S) and email URLs.
  var regexToken = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g;

  // Iterate through any URLs in the text.
  while( (matchArray = regexToken.exec( source )) !== null )
  {
      var token = matchArray[0];
      urlArray.push( token );
  }

  return urlArray;
}

var Q_addPost = function(data, next) {
  var opengraph = {};

  async.series({
    verifyLink: function(done) {
      var urls = findUrls(data.post.message);
      if(!urls) {
        return done();
      }
      if(!urls || (urls.length && (urls[0].indexOf('@') > -1 || urls[0].indexOf('http') < 0))) {
        return next ? next() : true;
      }
      data.post.action = {link: urls[0]};
      request( { method: "HEAD", url: urls[0], followAllRedirects: true, maxRedirects:5 }, function (error, response) {
        if(!response || error) {
          return next ? next() : true;
        }
        data.post.link = response.request.href;
        data.post.isVerified = data.post && data.post.from && data.post.from.website ? (data.post.link.indexOf(data.post.from.website.replace('www.', '')) > -1 ? true : false) : false;
        done();
      });
    },
    updatePost: function(done) {
      data.post.format = 'post';
      data.post.fbId = data.post.id;
      if(data.post.likes && data.post.likes.data) data.post.likes = _.map(data.post.likes.data, function(item) {return item;});

      delete data.post.id;
      data.post.page = data.post.from.id;

      Post.findOne({fbId: data.post.fbId}, function(err, post) {
        if(!post) {
          post = new Post();
        }

        _.assign(post, data.post);

        post.save(function(err) {
          done();
        });
      });
    },
    updatePage: function(done) {
      Page.findOne({fbId: data.post.page}, function(err, page) {
        page.lastPostAt = new Date();
        page.save(function() {
          done();
        })
      });
    }
  }, function() {
    if(next) {
      next(null, 'success');
    }
  });
}

var Q_importAllFriendsPerUser = function(data, next) {
  var likes = [];
  var fields = 'id,name,picture,link';

  graph.setAccessToken(data.accessToken);

  graph.get('/' + data.userID + '/friends?limit=100' + (fields ? '&fields=' + fields : '') + (data.after ? '&after=' + data.after : ''), function(err, output) {
    likes = output.data;
    async.forEach(likes, function(item, cb) {
      Q_addFriend({friendID: item.id, userID: data.userID}, function() {
        cb();
      });
    }, function() {
      next(null, 'success');
    })
  });
}

var Q_addFriend = function(data, next) {
  var likes = [];

  UserFriend.findOne({friend: data.friendID, user: data.userID}, function(err, userfriend) {
    if(!userfriend) {
      userfriend = new UserFriend();
    }
    userfriend.friend = data.friendID;
    userfriend.user = data.userID;

    userfriend.save(function(err) {
      next(null, 'success');
    });
  });
}

var Q_followPage = function(data, next) {
  var likes = [];
  UserPage.findOne({page: data.pageID, user: data.userID}, function(err, userpage) {
    if(!userpage) {
      userpage = new UserPage();
    }
    userpage.page = data.pageID;
    userpage.user = data.userID;

    userpage.save(function(err) {
      next(null, 'success');
    });
  });
}

var Q_activateUserFeed = function(data, next) {
  User.findOne({fbId: data.userID}, function(err, user) {
    if(!user) {
      return next ? next() : true;
    }
    user.isFeedReady = true;
    user.save(function(err) {
      return next ? next(null, 'success') : true;
    });
  });
}

var Q_addPage = function(data, next) {
  var appToken = config.facebook.clientID + '|' + config.facebook.clientSecret;

  Page.findOne({fbId: data.page.id}, function(err, page) {
    if(!page) {
      page = new Page();
    }
    page.fbId = data.page.id;
    page.name = data.page.name;

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
    page.location = data.page.location;
    page.description = data.page.description;
    page.general_info = data.page.general_info;
    page.phone = data.page.phone;
    page.username = data.page.username;
    page.website = data.page.website;
    page.likes = data.page.likes;
    page.emails = data.page.emails;

    page.isStore = (approved_categories.indexOf(page.category) > -1 ? true: false);
    if(!page.isStore) {
      _.each(page.category_list, function(subcategory) {
          if (approved_subcategories.indexOf(subcategory) > -1) {
            page.isStore = true;
          }
      });
    }

    if(page.isStore || page.isBrand) {
      page.isVerified = true;
    }

    page.save(function(err) {
      Q_followPage({pageID: page.fbId, userID: data.userID}, function() {
        if(page.isVerified) {
          Q_importAllPostsPerPage({pageID: page.fbId, accessToken: appToken}, function() {
            next(null, 'success');
          })
        } else {
          next(null, 'success');
        }
      });
    });
  });
}

var Q_importAllLikesPerUser = function(data, next) {
  var likes = [];

  graph.setAccessToken(data.accessToken);

  graph.get('/' + data.userID + '/likes?limit=100&fields=id,category,name,updated_time,created_time,picture,bio,category_list,contact_address,cover,current_location,location,description,emails,general_info,link,phone,username,website,likes' + (data.after ? '&after=' + data.after : ''), function(err, output) {
    if(err) {
      return next(null, err);
    }
    likes = output.data;
    async.forEach(likes, function(item, cb) {
      Q_addPage({page: item, userID: data.userID}, function() {
        cb();
      });
    }, function() {
      if(output.paging && output.paging.cursors.after) {
        Q_importAllLikesPerUser({userID: data.userID, accessToken: data.accessToken, after: output.paging.cursors.after}, null);
      } else {
        Q_activateUserFeed({userID: data.userID}, null);
      }
      if(next) {
        next(null, 'success');
      }
    })
  });
}

exports.Q_importAllLikesPerUser = Q_importAllLikesPerUser;
exports.Q_addPage = Q_addPage;
exports.Q_followPage = Q_followPage;
exports.Q_importAllFriendsPerUser = Q_importAllFriendsPerUser;
exports.Q_addFriend = Q_addFriend;
exports.Q_importAllPostsPerPage = Q_importAllPostsPerPage;
exports.Q_importAllPostsPerPageBulk = Q_importAllPostsPerPageBulk;
exports.Q_addPost = Q_addPost;
