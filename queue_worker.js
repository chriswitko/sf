var monq = require('monq');
var config = require('./server/config/config.js');

var client = monq(process.env.MONGODB_URI || config.db, { safe: true });
var worker = client.worker(['sna_default']);

worker.register({
  Q_importAllFriendsPerUser: require('./listener').Q_importAllFriendsPerUser,
  Q_importAllPostsPerPage: require('./listener').Q_importAllPostsPerPage
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
