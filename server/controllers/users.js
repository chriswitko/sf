"use strict";

var env = process.env.NODE_ENV || 'development';

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
  res.json({status: 'success'});
};

exports.getApi = function(req, res) {
  res.json({status: 'success'});
};

