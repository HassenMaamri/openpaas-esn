'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The messages module', function() {

  describe('POST /api/messages', function() {
    var validReq;

    before(function() {
      validReq = {
        user: {
          emails: ['aEmail'],
          _id: 123
        },
        body: {
          'object': {
            'objectType': 'whatsup',
            'description': 'whatsup message content'
          },
          'targets': [
            {
              'objectType': 'activitystream',
              'id': 'urn:linagora:esn:activitystream:<activitystream uuid>'
            }
          ]
        }
      };
    });

    it('should return 500 if the user is not set in the request', function(done) {
      var res = {
        send: function(code, message) {
          expect(code).to.equal(500);
          expect(message.error.details).to.contain('User');
          done();
        }
      };

      var messageModuleMocked = {};
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.createOrReplyToMessage({}, res);
    });

    it('should return 400 if the message is not in the body', function(done) {
      var req = {
        user: {
          emails: ['aEmail']
        }
      };
      var res = {
        send: function(code, message) {
          expect(code).to.equal(400);
          expect(message).to.contain('Missing');
          done();
        }
      };

      var messageModuleMocked = {};
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.createOrReplyToMessage(req, res);
    });

    it('should return 500 if it cannot save the message in the database', function(done) {
      var res = {
        send: function(code, message) {
          expect(code).to.equal(500);
          expect(message.error.details).to.contain('Cannot');
          done();
        }
      };

      var messageModuleMocked = {
        save: function(message, callback) {
          callback(new Error('an error has occured'));
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.createOrReplyToMessage(validReq, res);
    });

    it('should return 201 and the id of the newly created message', function(done) {
      var res = {
        send: function(code, message) {
          expect(code).to.equal(201);
          expect(message._id).to.equal('a new id');
          done();
        }
      };

      var messageModuleMocked = {
        save: function(message, callback) {
          callback(null, {_id: 'a new id'});
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.createOrReplyToMessage(validReq, res);
    });

    it('should publish into "message:activity" on success', function(done) {
      var topicUsed = '';
      var dataPublished = null;

      var res = {
        send: function() {
          expect(topicUsed).to.equal('message:activity');
          expect(dataPublished).to.exist;
          done();
        }
      };

      var messageModuleMocked = {
        save: function(message, callback) {
          callback(null, {_id: 'a new id', message: 123 });
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var pubsubMocked = {
        local: {
          topic: function(topic) {
            return {
              publish: function(data) {
                topicUsed = topic;
                dataPublished = data;
              }
            };
          }
        }
      };
      mockery.registerMock('../../core/pubsub', pubsubMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.createOrReplyToMessage(validReq, res);
    });

    it('should return 404 otherwise', function(done) {
      var res = {
        send: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };

      var messageModuleMocked = {
        save: function(message, callback) {
          callback(null, false);
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.createOrReplyToMessage(validReq, res);
    });
  });

  describe('POST /api/messages with inReplyTo parameter', function() {
    var validReq;

    before(function() {
      validReq = {
        user: {
          emails: ['aEmail'],
          _id: 123
        },
        body: {
          'object': {
            'objectType': 'whatsup',
            'description': 'whatsup message content'
          },
          inReplyTo: {
            'objectType': 'whatsup',
            '_id': 'commentUuid'
          }
        }
      };
    });

    it('should return 500 if it cannot save the comment in the database', function(done) {
      var res = {
        send: function(code, message) {
          expect(code).to.equal(500);
          expect(message.error.details).to.contain('Cannot');
          done();
        }
      };

      var messageModuleMocked = {
        addNewComment: function(message, inReplyTo, callback) {
          callback(new Error('an error has occured'));
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.createOrReplyToMessage(validReq, res);
    });

    it('should return 201 with the _id of the new comment and the parentId', function(done) {
      var res = {
        send: function(code, data) {
          expect(code).to.equal(201);
          expect(data._id).to.equal('an id');
          expect(data.parentId).to.equal('a parent id');
          done();
        }
      };

      var messageModuleMocked = {
        addNewComment: function(message, inReplyTo, callback) {
          callback(null, {_id: 'an id'}, {_id: 'a parent id'});
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.createOrReplyToMessage(validReq, res);
    });

    it('should publish into "message:activity" on success', function(done) {
      var topicUsed = '';
      var dataPublished = null;

      var res = {
        send: function() {
          expect(topicUsed).to.equal('message:activity');
          expect(dataPublished).to.exist;
          done();
        }
      };

      var messageModuleMocked = {
        addNewComment: function(message, inReplyTo, callback) {
          callback(null, {_id: 'an id'}, {targets: 'some targets'});
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var pubsubMocked = {
        local: {
          topic: function(topic) {
            return {
              publish: function(data) {
                topicUsed = topic;
                dataPublished = data;
              }
            };
          }
        }
      };
      mockery.registerMock('../../core/pubsub', pubsubMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.createOrReplyToMessage(validReq, res);
    });

  });

  describe('GET /api/messages', function() {
    var validReq;

    before(function() {
      validReq = {
        user: {
          emails: ['aEmail']
        },
        query: {
          'ids': ['1', '2']
        }
      };
    });

    it('should return 500 if the user is not set in the request', function(done) {
      var res = {
        send: function(code, message) {
          expect(code).to.equal(500);
          expect(message.error.details).to.contain('User');
          done();
        }
      };

      var messageModuleMocked = {};
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.getMessages({}, res);
    });

    it('should return 400 if the ids is not in the query', function(done) {
      var req = {
        user: {
          emails: ['aEmail']
        }
      };
      var res = {
        send: function(code, message) {
          expect(code).to.equal(400);
          expect(message).to.contain('Missing');
          done();
        }
      };

      var messageModuleMocked = {};
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.getMessages(req, res);
    });

    it('should return 500 if it cannot findByIds the messages in the database', function(done) {
      var res = {
        send: function(code, message) {
          expect(code).to.equal(500);
          expect(message.error.details).to.contain('Cannot');
          done();
        }
      };

      var messageModuleMocked = {
        findByIds: function(ids, callback) {
          callback(new Error('an error has occured'));
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.getMessages(validReq, res);
    });

    it('should return 200 and the messages found by ids, also not found ones', function(done) {
      var res = {
        send: function(code, message) {
          expect(code).to.equal(200);
          expect(message[0]._id.toString()).to.equal('1');
          expect(message[1]).to.deep.equal(
            {
              error: {
                status: 404,
                message: 'Not Found',
                details: 'The message 2 can not be found'
              }
            });
          expect(message.length).to.equal(2);
          done();
        }
      };

      var messageModuleMocked = {
        findByIds: function(ids, callback) {
          expect(ids).to.deep.equal(['1', '2']);
          callback(null, [
            {
              _id: {
                toString: function() {
                  return '1';
                }
              }
            }
          ]);
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.getMessages(validReq, res);
    });

    it('should return 200 and only the messages found by ids', function(done) {
      var res = {
        send: function(code, message) {
          expect(code).to.equal(200);
          expect(message[0]._id.toString()).to.equal('1');
          expect(message[1]._id.toString()).to.equal('2');
          expect(message.length).to.equal(2);
          done();
        }
      };

      var messageModuleMocked = {
        findByIds: function(ids, callback) {
          expect(ids).to.deep.equal(['1', '2']);
          callback(null, [
            {
              _id: {
                toString: function() {
                  return '1';
                }
              }
            },
            {
              _id: {
                toString: function() {
                  return '2';
                }
              }
            }
          ]);
        }
      };
      mockery.registerMock('../../core/message', messageModuleMocked);

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.getMessages(validReq, res);
    });
  });

  describe('The getMessage fn', function() {
    it('should return send back HTTP 400 if req.param.uuid is undefined', function(done) {
      mockery.registerMock('../../core/message', {});

      var req = {
        param: function() {
          return null;
        }
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.getMessage(req, res);
    });

    it('should return send back HTTP 500 if core module returns an error', function(done) {

      var mock = {
        get: function(id, callback) {
          return callback(new Error());
        }
      };
      mockery.registerMock('../../core/message', mock);

      var req = {
        param: function() {
          return '1234';
        }
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.getMessage(req, res);
    });

    it('should return send back HTTP 404 if core module does not find the message', function(done) {
      var mock = {
        get: function(id, callback) {
          return callback();
        }
      };
      mockery.registerMock('../../core/message', mock);

      var req = {
        param: function() {
          return '1234';
        }
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.getMessage(req, res);
    });

    it('should return send back HTTP 200 if core module finds the message', function(done) {
      var mock = {
        get: function(id, callback) {
          return callback(null, {_id: 123});
        }
      };
      mockery.registerMock('../../core/message', mock);

      var req = {
        param: function() {
          return '1234';
        }
      };

      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };

      var messages = require(this.testEnv.basePath + '/backend/webserver/controllers/messages');
      messages.getMessage(req, res);
    });

  });
});