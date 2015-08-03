
/*!
 * Module dependencies.
 */

var fs = require('fs');
var env = {};
var envFile = __dirname + '/' + (process.env.NODE_ENV || 'development') + '.json';

// Read env.json file, if it exists, load the id's and secrets from that
// Note that this is only in the development env
// it is not safe to store id's in files

if (fs.existsSync(envFile)) {
  env = fs.readFileSync(envFile, 'utf-8');
  env = JSON.parse(env);
  Object.keys(env).forEach(function (key) {
    process.env[key] = env[key];
  });
}

/**
 * Expose
 */

module.exports = {
  host: 'http://localhost:3000',
  db_name: 'shopnowapp-dev',
  db: 'mongodb://localhost/shopnowapp-dev',
  facebook: {
    secretRTUKey: 'shopnowapp-lovesyou',
    clientID: process.env.FACEBOOK_CLIENTID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  }
};