var Bot = require(require('path').join('..','..','core','bot.js'));

/**
 * Github Bot
 * @class Github
 * @augments Bot
 * @param {string} name
 * @param {string} folder
 * @param {Github~Configuration[]} allConfigurations
 * @constructor
 */
function Github(name, folder, allConfigurations){
  Bot.call(this, name, folder, allConfigurations);

  this.defaultValues.hostname = 'api.github.com';
  
  this.defaultValues.httpModule = 'https';
  this.defaultValues.port = 443;
  this.defaultValues.scopes = 'user,public_repo,repo,repo_deployment,repo:status,delete_repo,notifications,gist,read:repo_hook,write:repo_hook,admin:repo_hook,admin:org_hook,read:org,write:org,admin:org,read:public_key,write:public_key,admin:public_key,read:gpg_key,write:gpg_key,admin:gpg_key';
  
  this.defaultValues.defaultRemainingRequest = 5000;
  this.defaultValues.defaultRemainingTime = 60*60;
}

Github.prototype = new Bot();
Github.prototype.constructor = Github;

/**
 * Prepare and complete parameters for request
 * @param {Bot~doRequestParameters} parameters
 * @param {Bot~requestCallback|*} callback
 */
Github.prototype.prepareRequest = function(parameters, callback) {
  this.addQueryAccessToken(parameters);
  this.addUserAgentHeader(parameters);
  this.doRequest(parameters, callback);
};

/**
 * API me
 * @param {Github~requestCallback} callback
 */
Github.prototype.me = function(callback) {
  var params = {
    method: 'GET',
    path: 'user',
    output: {
      model: 'User'
    }
  };

  this.prepareRequest(params, callback);
};


/**
 * Add access token to query parameters
 * @param {Bot~doRequestParameters} parameters
 */
Github.prototype.addQueryAccessToken = function(parameters) {
  if(parameters.get === undefined) {
    parameters.get = {};
  }

  parameters.get.access_token = this.accessToken.access_token;
};

Github.prototype.addUserAgentHeader = function(parameters){
  if(parameters.headers === undefined) {
    parameters.headers = {};
  }

  parameters.headers['User-Agent'] = 'RMasterBot - RMBGithub';
};

/**
 * Get remaining requests from result 
 * @param {Request~Response} resultFromRequest
 * @return {Number}
 */
Github.prototype.getRemainingRequestsFromResult = function(resultFromRequest) {
  return resultFromRequest.headers['x-ratelimit-remaining'];
};

/**
 * Get url for Access Token when you have to authorize an application
 * @param {string} scopes
 * @param {*} callback
 */
Github.prototype.getAccessTokenUrl = function(scopes, callback) {
  var url = 'https://github.com/login/oauth/authorize?'
    + 'redirect_uri=' + this.currentConfiguration.callback_uri + '&'
    + 'client_id=' + this.currentConfiguration.client_id + '&'
    + 'scope=' + this.getScopeForAccessTokenServer(scopes).replace(/,/g,'%20');

  callback(url);
};

/**
 * Extract response in data for Access Token
 * @param {Object} req request from local node server
 * @return {*} code or something from response
 */
Github.prototype.extractResponseDataForAccessToken = function(req) {
  var query = require('url').parse(req.url, true).query;

  if(query.code === undefined) {
    return null;
  }

  return query.code;
};

/**
 * Request Access Token after getting code
 * @param {string} responseData
 * @param {Bot~requestAccessTokenCallback} callback
 */
Github.prototype.requestAccessToken = function(responseData, callback) {
  var params = {
    method: 'POST',
    hostname: 'github.com',
    path: 'login/oauth/access_token',
    post:{
      client_id: this.currentConfiguration.client_id,
      client_secret: this.currentConfiguration.client_secret,
      code: responseData,
      redirect_uri: this.currentConfiguration.callback_uri
    },
    headers:{
      'Accept': 'application/json'
    }
  };

  this.request(params, function(error, result){
    if(error) {
      callback(error, null);
      return;
    }

    if(result.statusCode === 200) {
      callback(null, JSON.parse(result.data));
    }
    else {
      callback(JSON.parse(result.data), null);
    }
  });
};

/**
 * getAccessTokenFromAccessTokenData
 * @param {*} accessTokenData
 * @return {*}
 */
Github.prototype.getAccessTokenFromAccessTokenData = function(accessTokenData) {
  return accessTokenData.access_token;
};

/**
 * getTypeAccessTokenFromAccessTokenData
 * @param {*} accessTokenData
 * @return {*}
 */
Github.prototype.getTypeAccessTokenFromAccessTokenData = function(accessTokenData) {
  return accessTokenData.token_type;
};

/**
 * getUserForNewAccessToken
 * @param {*} formatAccessToken
 * @param {Bot~getUserForNewAccessTokenCallback} callback
 */
Github.prototype.getUserForNewAccessToken = function(formatAccessToken, callback) {
  var that = this;

  that.setCurrentAccessToken(formatAccessToken.access_token);
  that.verifyAccessTokenScopesBeforeCall = false;
  this.me(function(err, user){
    that.verifyAccessTokenScopesBeforeCall = true;
    if(err) {
      callback(err, null);
    }
    else {
      var username = (user !== null) ? user.getLogin() : null;
      callback(null, username);
    }
  });
};

Github.prototype.extractDataFromRequest = function(data) {
  return data;
};

module.exports = Github;

/**
 * Github Configuration
 * @typedef {Object} Github~Configuration
 * @property {string} name
 * @property {string} client_id
 * @property {string} client_secret
 * @property {string} access_token
 * @property {string} callback_uri
 * @property {string} scopes
 */
/**
 * Request callback
 * @callback Github~requestCallback
 * @param {Error|string|null} error - Error
 * @param {*} data
 */
