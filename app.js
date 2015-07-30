var config = require('./server/config/config.js');
var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var mongoose = require('mongoose');
var _ = require('lodash');
var graph = require('fbgraph');
var fb = require('ilkkah-fb');
var methodOverride = require('method-override');

// var MC = require('mongomq').MongoConnection;
// var MQ = require('mongomq').MongoMQ;

var User = require('./server/models/user');

var userController = require('./server/controllers/users');
// var pageController = require('./server/controllers/pages');

var Children = require('./server/common/child');
// var talker = Children.startChild('./talker');
// var listener = Children.startChild('./listener');

// var mq_options = {databaseName: config.db_name, queueCollection: 'capped_collection', autoStart: false};
// var mq = new MQ(mq_options);

// Connect to mongodb
var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  mongoose.connect(config.db, options);
};
connect();

mongoose.connection.on('error', console.log);
mongoose.connection.on('disconnected', connect);

// var silence = new User({ name: 'Silence' })
// silence.save(function (err, fluffy) {
//   if (err) return console.error(err);
//   console.log(fluffy);
// });

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


app.use(express.static('build'));

// app.use(fbsdk.facebook({
//   appId  : '1437146103270324',
//   secret : '90bb44bc8a3394099b075e5c0db73898'
// }))

// // app.use(function(req, res, next) {
// //   if (req.facebook.getSession()) {
// //     console.log('Welcome back');
// //     // res.end('<a href="' + req.facebook.getLogoutUrl() + '">Logout</a>');

// //     // get my graph api information
// //     // req.facebook.api('/me', function(me) {
// //     //   console.log(me);
// //     // });
// //   } else {
// //     console.log('Not signed in...')
// //     // res.end('<a href="' + req.facebook.getLoginUrl() + '">Login</a>');
// //   }
// //   next();
// // });

app.set('views', './build');
// app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);


app.get('/api/user/test', userController.getApi);
app.post('/api/user/authenticate', userController.authenticate);
app.get('/api/user/importLikes', userController.importLikes);
app.get('/api/user/importFriends', userController.importFriends);
app.get('/api/user/friends', userController.friends);
app.get('/api/user/pages', userController.pages);
app.get('/api/user/posts', userController.posts);

app.get('/api/business/importPosts', userController.importPosts);
app.get('/api/business/importPostsBulk', userController.importPostsBulk);

// app.get('/api/page/follow', pageController.friends);

app.get('/', function (req, res) {
  res.render('index.html');
  // console.log('config', config);
  // res.send('Hello World!');
});

app.post('/', function (req, res) {
  res.send('Hello World!');
});

function getLikesResults(url, cb) {
  var categories = ['Shopping & Retail', 'Clothing', 'Clothing Store', 'Bags/luggage', 'Home decor', 'Outdoor gear/sporting goods', 'Retail and consumer merchandise', 'Furniture', 'Shopping/retail'];
  var subcategories = ['Toy Store', 'Company', 'Shopping/Retail', "Men's Clothing Store", "Women's Clothing Store", 'Computers & Electronics', 'Bike Shop', 'Sporting Goods Store', 'Manufacturing', 'Clothing Store'];

  fbsdk.facebook.api(url, function(items) {
    console.log('NEXT', items.paging.cursors.after);
    console.log('TOTAL', items.data.length);
    likes = _.filter(items.data, function(item) {
      sublikes = _.xor(_.pluck(_.flatten(item.category_list, true), 'name'), subcategories).length;
      // console.log(sublikes);
      return categories.indexOf(item.category) > -1 || (item.category_list && subcategories.length < sublikes.length);
    });

    cb({
      likes: likes,
      next: items.paging.cursors.next
    })
  });
}

app.get('/api/user/:id/likes', function(req, res) {
  var sublikes = [];
  var likes = [];

  var categories = ['Shopping & Retail', 'Clothing', 'Clothing Store', 'Bags/luggage', 'Home decor', 'Outdoor gear/sporting goods', 'Retail and consumer merchandise', 'Furniture', 'Shopping/retail'];
  var subcategories = ['Toy Store', 'Company', 'Shopping/Retail', "Men's Clothing Store", "Women's Clothing Store", 'Computers & Electronics', 'Bike Shop', 'Sporting Goods Store', 'Manufacturing', 'Clothing Store'];

  var access_token = "CAAUbE6b5y7QBAFhHsyusBHtqwPb8sK4lfJpqYQvjgbYv0aBusI62wjLZCNjgi8yQhQcfJ8PuF5q89KQKgiQxeUhZAZA1w2wJBZAAXaCTY5JSJeBqkW3zPCYcvZBRzFZBNe5b3IeaxcuRbzY70qOEbZBe73a72qyMP7eDQpZC15YyvsKBXTtZAygKMEarVrqJAdTX5ZB74mcGc9bAf4dnZAqHnhxn9dp6XIUZBbYZD";
  var long_toke_access_token = "CAAUbE6b5y7QBAEalZCnAysrSSw4bzWqdKQMNiZAZAXUaZAnrzpvJ07CKoha3uh71ZB0GHZA1O6cWtLfZBDoSAMFSp92sGmVuyQijZA8BbHce4chzt0BZCYfTvVg8t9fzdgxNnjMpOIiTJl5Y81S7wdt8kftWLJZCV6BfuRBXbUMtYiYfVFbvaA9lkD";

  // var lifetime_token = 'https://graph.facebook.com/oauth/access_token?redirect_uri=http://localhost:3000&grant_type=fb_exchange_token&client_id=1437146103270324&client_secret=90bb44bc8a3394099b075e5c0db73898&fb_exchange_token=' + access_token;
  // console.log(lifetime_token);
  // req.facebook.api(lifetime_token, function(token) {
  //   console.log('token', token);
  // });

  graph.setVersion('2.3');
  graph.setAccessToken(long_toke_access_token);
  // FB.setAccessToken(long_toke_access_token);
  // https://github.com/criso/fbgraph

  graph.get('/me/likes?limit=100' + (req.query.after ? '&after=' + req.query.after : ''), function(err, output) {
    if(output.paging) console.log('NEXT', output.paging.cursors.after);
    console.log('TOTAL', output.data.length);
    likes = _.filter(output.data, function(item) {
      sublikes = _.xor(_.pluck(_.flatten(item.category_list, true), 'name'), subcategories).length;
      // console.log(sublikes);
      return categories.indexOf(item.category) > -1 || (item.category_list && subcategories.length < sublikes.length);
    });
    res.json({data: likes, total: likes.length, next: (output.paging ? 'http://localhost:3000/api/user/10153293997474293/likes?limit=100&after=' + output.paging.cursors.after : '')});
  });


  // req.facebook.api('/' + req.params.id + '/likes?limit=100&access_token=' + long_toke_access_token, function(items) {
  //   console.log('NEXT', items.paging.cursors.after);
  //   console.log('TOTAL', items.data.length);
  //   likes = _.filter(items.data, function(item) {
  //     sublikes = _.xor(_.pluck(_.flatten(item.category_list, true), 'name'), subcategories).length;
  //     // console.log(sublikes);
  //     return categories.indexOf(item.category) > -1 || (item.category_list && subcategories.length < sublikes.length);
  //   });

  //   res.json({data: likes})
  // });
});

//https://github.com/ile/fb-real-time-example/blob/master/routes/index.js

// app.get('/api/queue', function(req,res) {
//   mq.emit('test', {name: req.query.task});
//   res.json({status: 'success', data: req.query.task});
// });

app.post('/deauthorize', function(req, res, next) {
  var request = fb.parseSignedRequest(req.body.signed_request, appSecret);
  console.log('post /deauthorize', request);
  res.send('');
});

app.get('/rtu', function(req, res, next) {
  console.log('get /rtu', req.query);
  if (req.query['hub.verify_token'] === 'moi') {
    res.send(req.query['hub.challenge']);
  }
});

app.post('/rtu', function(req, res, next) {
  console.log('post /rtu', req.body);
  res.send('');
});

// app.locals({
//   config: config
// });

app.get('*', function (req, res) {
  res.render('index.html');
  // console.log('config', config);
  // res.send('Hello World!');
});

app.use(function (req, res, next) {
  console.log('config2', config);
   res.locals = {
     config: config
   };
   next();
});

app.use(methodOverride());
app.use(function(err, req, res, next) {
  console.error('stack', err.stack);
  res.status(500).json({status: 'error', 'message': err.toString()});
});

// app.get('*', function(req, res) {

// });

var server = app.listen(process.env.PORT || 3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});

// // QUEUES SERVER
//
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
