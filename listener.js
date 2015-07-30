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

console.log('env', env);

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

// var mq = module.exports = new MQ(options);
//
// var log;
//
// var handleRecord = function(err, data, next){
//   setTimeout(function() {
//     var w = Math.floor(Math.random()*100);
//     if(!err){
//       console.log('data: ', data, 'wait: ', w);
//       console.log('data', data);
//       log.insert({handled: data}, {w:0});
//     }else{
//       console.log('err: ', err, 'wait: ', w);
//     }
//     next();
//   }, 10000);
// };


var approved_categories = ['Shopping & Retail', 'Clothing', 'Clothing Store', 'Bags/luggage', 'Home decor', 'Outdoor gear/sporting goods', 'Retail and consumer merchandise', 'Furniture', 'Shopping/retail', 'Bags/Luggage', 'Book Store', 'Health/Beauty', 'Home Decor', 'Home/Garden Website', 'Household Supplies', 'Jewelry/Watches', 'Local Business', 'Outdoor Gear/Sporting Goods', 'Retail and Consumer Merchandise', 'Shopping/Retail', 'Spas/Beauty/Personal Care'];
var approved_subcategories = ['Toy Store', 'Company', 'Shopping/Retail', "Men's Clothing Store", "Women's Clothing Store", 'Computers & Electronics', 'Bike Shop', 'Sporting Goods Store', 'Manufacturing', 'Clothing Store', 'Shoe Store'];

graph.setVersion('2.3');

// 30*24*60*60 = 2592000

// var getOpenGraph = function(url, cb) {
//   var result = {}, attr = function( tag, prop ){ return tag.attribs && tag.attribs[prop] || ""; }
//
//   request( url, function( err, res, body ) {
//
//     var metas = cheerio.load(body.replace('og:', 'og_'))('meta')
//     var keys = Object.keys(metas)
//     // console.log('meta', metas);
//
//     keys.forEach(function(i){
//       var meta = metas[i];
//       var property = attr(meta,'property');
//       var parts = property.split(":");
//
//       // console.log('property', property);
//       if ( property ) {
//         var og = property.split(':'),
//           parent = result;
//
//           // console.log('og', og);
//
//         for ( var j = 0; j < og.length; j++ ){
//           var token = og[j],
//             current = parent[token],
//             name;
//
//           if ( j+1 == og.length ) { // leaf node
//
//             // expected leaf is already a branch so append a name attr
//             if ( current instanceof Object ) name = token;
//             // leaf should take the value given
//             else parent[token] = attr(meta,'content');
//
//           } else { // branch node
//
//             // if no such branch exists, make one
//             if ( !(current instanceof Object) ) {
//               // if the branch is already a leaf, move value to name attr
//               if ( typeof current == "string" ) name = current;
//               current = {};
//               parent[token] = current;
//             }
//           }
//           if ( name ) current["name"] = name;
//           name = undefined
//           parent = current;
//         }
//       }
//     });
//     cb(result.og);
//   });
// }

var Q_importAllPostsPerPage = function(data, next) {
  var likes = [];
  var fields = 'id,from.fields(id,website),message,picture,full_picture,link,type,created_time,likes.fields(id,name,picture,link)';
  var since = Date.parse('-1 days');

  graph.setAccessToken(data.accessToken);

  graph.get('/' + data.pageID + '/posts?limit=1' + (since ? '&since=' + since : '') + (fields ? '&fields=' + fields : '') + (data.after ? '&after=' + data.after : ''), function(err, output) {
    console.log('err', err);
    console.log('-------------------');
    // console.log('output', output);
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
      console.log('finito');
      // if(output.paging && output.paging.cursors.after) {
      //   console.log('after', output.paging ? output.paging.cursors.after : 'FIRST PAGE');
      //   Q_importAllFriendsPerUser(null, {userID: data.userID, accessToken: data.accessToken, after: output.paging.cursors.after}, null);
      // }
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
  console.log('query', query);

  graph.setAccessToken(data.accessToken);

  graph.get(query, function(err, output) {
    console.log('output', output);
    console.log('err', err);
    console.log('-------------------');
    // console.log('output', output);
    likes = _.map(output, function(item) {return item.posts.data});
    console.log(likes);
    // likes = output.data;
    async.forEach(likes, function(item, cb) {
      if(item.type === 'link' || item.type === 'photo') {
        Q_addPost({post: item}, function() {
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
      console.log('>>> LINK', urls[0]);
      if(!urls || (urls.length && (urls[0].indexOf('@') > -1 || urls[0].indexOf('http') < 0))) {
        return next ? next() : true;
      }
      console.log('PARSING', urls[0]);
      data.post.action = {link: urls[0]};
      request( { method: "HEAD", url: urls[0], followAllRedirects: true, maxRedirects:5 }, function (error, response) {
        if(!response || error) {
          return next ? next() : true;
        }
        data.post.link = response.request.href;
        console.log('website', data.post.from.website);
        console.log('data.post.link', data.post.link);
        data.post.isVerified = data.post && data.post.from && data.post.from.website ? (data.post.link.indexOf(data.post.from.website.replace('www.', '')) > -1 ? true : false) : false;
        done();
      });
    },
    // getOpenGraph: function(done) {
    //   if(!data.post.isVerified) {
    //     return done();
    //   }
    //   // console.log('link', data.post.link);
    //   opengraphServer({url: data.post.link}, function(err, ogp) {
    //     console.log ('ogp', ogp.data);
    //     if(ogp && ogp.data) {
    //       if(ogp.data.ogType === 'og:product' || ogp.data.ogType === 'product' || ogp.data.ogType === 'og_product') {
    //         opengraph = ogp.data;
    //         data.post.og = ogp.data;
    //         data.post.format = 'product';
    //         data.post.action['cta'] = 'Buy';
    //       }
    //     }
    //     done();
    //   });
    // },
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
          console.log('save page err', err);
          // done();
          // if(next) {
          //   next();
          // }
          done();
        });
      });
    },
    updatePage: function(done) {
      console.log('data.post.page', data.post.page);
      Page.findOne({fbId: data.post.page}, function(err, page) {
        console.log('err', err);
        console.log('page', page);
        page.lastFlashMessageAt = new Date();
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
  console.log('DOING 1');

  graph.setAccessToken(data.accessToken);

  graph.get('/' + data.userID + '/friends?limit=100' + (fields ? '&fields=' + fields : '') + (data.after ? '&after=' + data.after : ''), function(err, output) {
    console.log('DOING 2');
    console.log('err', err);
    console.log('-------------------');
    // console.log('output', output);
    likes = output.data;
    console.log('DOING 3');
    async.forEach(likes, function(item, cb) {
      Q_addFriend({friendID: item.id, userID: data.userID}, function() {
        cb();
      });
    }, function() {
      console.log('DOING 4');
      console.log('finito');
      // if(output.paging && output.paging.cursors.after) {
      //   console.log('after', output.paging ? output.paging.cursors.after : 'FIRST PAGE');
      //   Q_importAllFriendsPerUser(null, {userID: data.userID, accessToken: data.accessToken, after: output.paging.cursors.after}, null);
      // }
      // if(next) {
        next(null, 'success');
      // }
    })
  });
}

var Q_addFriend = function(data, next) {
  console.log('Q1');
  var likes = [];

  console.log('Q2', {friend: data.friendID, user: data.userID});
  UserFriend.findOne({friend: data.friendID, user: data.userID}, function(err, userfriend) {
    console.log('Q4');
    if(!userfriend) {
      userfriend = new UserFriend();
    }
    console.log('inside', data.id);
    userfriend.friend = data.friendID;
    userfriend.user = data.userID;

    userfriend.save(function(err) {
      console.log('save page err', err);
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
    console.log('inside', data.id);
    userpage.page = data.pageID;
    userpage.user = data.userID;

    userpage.save(function(err) {
      console.log('save page err', err);
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
      console.log('save page err', err);
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
    console.log('err', err);
    if(err) {
      return next(null, 'success');
    }
    console.log('-------------------');
    // console.log('output', output);
    likes = output.data;
    async.forEach(likes, function(item, cb) {
      Q_addPage({page: item, userID: data.userID}, function() {
        cb();
      });
    }, function() {
      console.log('finito');
      if(output.paging && output.paging.cursors.after) {
        console.log('after', output.paging ? output.paging.cursors.after : 'FIRST PAGE');
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
