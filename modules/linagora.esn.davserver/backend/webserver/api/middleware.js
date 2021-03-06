'use strict';

module.exports = function(dependencies) {

  var utils = require('../../lib/utils')(dependencies);

  function getDavEndpoint(req, res, next) {
    utils.getDavEndpoint(req.user.preferredDomainId, function(davServerURL) {
      req.davserver = davServerURL;

      return next();
    });
  }

  return {
    getDavEndpoint: getDavEndpoint
  };

};
