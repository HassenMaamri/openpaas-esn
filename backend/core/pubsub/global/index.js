'use strict';

var Pubsub = require('../pubsub');
var redisPubsub = new Pubsub('global');
var localPubsub = require('../').local;
var AwesomeNodeRedisPubsub = require('awesome-node-redis-pubsub');
var logger = require('../../logger');

module.exports = redisPubsub;

localPubsub.topic('redis:configurationAvailable').subscribe(function(config) {
  config.onRedisError = function(err) {
    logger.error('Got an error on redis pubsub : ' + err);
    logger.debug('Redis pubsub error stack: ' + err.stack);
  };
  var client = new AwesomeNodeRedisPubsub(config);
  redisPubsub.setClient(client);
});
