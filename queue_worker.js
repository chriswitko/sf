var monq = require('monq');
var config = require('./server/config/config.js');

var client = monq(process.env.MONGODB_URI || config.db, { safe: true });
var worker = client.worker(['sna_default']);

console.log('ENV', process.env.NODE_ENV || 'development');

worker.register({
  Q_importAllFriendsPerUser: require('./listener').Q_importAllFriendsPerUser,
  Q_importAllPostsPerPage: require('./listener').Q_importAllPostsPerPage,
  Q_importAllPostsPerPageBulk: require('./listener').Q_importAllPostsPerPageBulk,
  Q_importAllLikesPerUser: require('./listener').Q_importAllLikesPerUser
});

worker.on('dequeued', function (data) {
    console.log('Dequeued:');
    console.log(data);
});

worker.on('failed', function (data) {
    console.log('Failed:');
    console.log(data);
});

worker.on('complete', function (data) {
    console.log('Complete:');
    console.log(data);
});

worker.on('error', function (err) {
    console.log('Error:');
    console.log(err);
    worker.stop();
});

worker.start();
