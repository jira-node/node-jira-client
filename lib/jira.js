'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @name JiraApi
 * @class
 * Wrapper for the JIRA Rest Api
 * https://docs.atlassian.com/jira/REST/6.4.8/
 */
var JiraApi = function () {
  /**
   * @constructor
   * @function
   * @param {JiraApiOptions} options
   */
  function JiraApi(options) {
    (0, _classCallCheck3.default)(this, JiraApi);

    this.protocol = options.protocol || 'http';
    this.host = options.host;
    this.port = options.port || null;
    this.apiVersion = options.apiVersion || '2';
    this.base = options.base || '';
    this.intermediatePath = options.intermediatePath;
    this.strictSSL = options.hasOwnProperty('strictSSL') ? options.strictSSL : true;
    // This is so we can fake during unit tests
    this.request = options.request || _requestPromise2.default;
    this.webhookVersion = options.webHookVersion || '1.0';
    this.greenhopperVersion = options.greenhopperVersion || '1.0';
    this.baseOptions = {};

    if (options.oauth && options.oauth.consumer_key && options.oauth.access_token) {
      this.baseOptions.oauth = {
        consumer_key: options.oauth.consumer_key,
        consumer_secret: options.oauth.consumer_secret,
        token: options.oauth.access_token,
        token_secret: options.oauth.access_token_secret,
        signature_method: options.oauth.signature_method || 'RSA-SHA1'
      };
    } else if (options.bearer) {
      this.baseOptions.auth = {
        user: '',
        pass: '',
        sendImmediately: true,
        bearer: options.bearer
      };
    } else if (options.username && options.password) {
      this.baseOptions.auth = {
        user: options.username,
        pass: options.password
      };
    }

    if (options.timeout) {
      this.baseOptions.timeout = options.timeout;
    }
  }

  /**
   * @typedef JiraApiOptions
   * @type {object}
   * @property {string} [protocol=http] - What protocol to use to connect to
   * jira? Ex: http|https
   * @property {string} host - What host is this tool connecting to for the jira
   * instance? Ex: jira.somehost.com
   * @property {string} [port] - What port is this tool connecting to jira with? Only needed for
   * none standard ports. Ex: 8080, 3000, etc
   * @property {string} [username] - Specify a username for this tool to authenticate all
   * requests with.
   * @property {string} [password] - Specify a password for this tool to authenticate all
   * requests with.
   * @property {string} [apiVersion=2] - What version of the jira rest api is the instance the
   * tool is connecting to?
   * @property {string} [base] - What other url parts exist, if any, before the rest/api/
   * section?
   * @property {string} [intermediatePath] - If specified, overwrites the default rest/api/version
   * section of the uri
   * @property {boolean} [strictSSL=true] - Does this tool require each request to be
   * authenticated?  Defaults to true.
   * @property {function} [request] - What method does this tool use to make its requests?
   * Defaults to request from request-promise
   * @property {number} [timeout] - Integer containing the number of milliseconds to wait for a
   * server to send response headers (and start the response body) before aborting the request. Note
   * that if the underlying TCP connection cannot be established, the OS-wide TCP connection timeout
   * will overrule the timeout option ([the default in Linux can be anywhere from 20-120 *
   * seconds](http://www.sekuda.com/overriding_the_default_linux_kernel_20_second_tcp_socket_connect_timeout)).
   * @property {string} [webhookVersion=1.0] - What webhook version does this api wrapper need to
   * hit?
   * @property {string} [greenhopperVersion=1.0] - What webhook version does this api wrapper need
   * to hit?
   * @property {OAuth} - Specify an oauth object for this tool to authenticate all requests using
   * OAuth.
   */

  /**
   * @typedef OAuth
   * @type {object}
   * @property {string} consumer_key - The consumer entered in Jira Preferences.
   * @property {string} consumer_secret - The private RSA file.
   * @property {string} access_token - The generated access token.
   * @property {string} access_token_secret - The generated access toke secret.
   * @property {string} signature_method [signature_method=RSA-SHA1] - OAuth signurate methode
   * Possible values RSA-SHA1, HMAC-SHA1, PLAINTEXT. Jira Cloud supports only RSA-SHA1.
   */

  /**
   *  @typedef {object} UriOptions
   *  @property {string} pathname - The url after the specific functions path
   *  @property {object} [query] - An object of all query parameters
   *  @property {string} [intermediatePath] - Overwrites with specified path
   */

  /**
   * @name makeRequestHeader
   * @function
   * Creates a requestOptions object based on the default template for one
   * @param {string} uri
   * @param {object} [options] - an object containing fields and formatting how the
   */


  (0, _createClass3.default)(JiraApi, [{
    key: 'makeRequestHeader',
    value: function makeRequestHeader(uri) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return (0, _extends3.default)({
        rejectUnauthorized: this.strictSSL,
        method: options.method || 'GET',
        uri: uri,
        json: true
      }, options);
    }

    /**
     * @typedef makeRequestHeaderOptions
     * @type {object}
     * @property {string} [method] - HTTP Request Method. ie GET, POST, PUT, DELETE
     */

    /**
     * @name makeUri
     * @function
     * Creates a URI object for a given pathname
     * @param {object} [options] - an object containing path information
     */

  }, {
    key: 'makeUri',
    value: function makeUri(_ref) {
      var pathname = _ref.pathname,
          query = _ref.query,
          intermediatePath = _ref.intermediatePath;

      var intermediateToUse = this.intermediatePath || intermediatePath;
      var tempPath = intermediateToUse || '/rest/api/' + this.apiVersion;
      var uri = _url2.default.format({
        protocol: this.protocol,
        hostname: this.host,
        port: this.port,
        pathname: '' + this.base + tempPath + pathname,
        query: query
      });
      return decodeURIComponent(uri);
    }

    /**
     * @typedef makeUriOptions
     * @type {object}
     * @property {string} pathname - The url after the /rest/api/version
     * @property {object} query - a query object
     * @property {string} intermediatePath - If specified will overwrite the /rest/api/version section
     */

    /**
     * @name makeWebhookUri
     * @function
     * Creates a URI object for a given pathName
     * @param {object} [options] - An options object specifying uri information
     */

  }, {
    key: 'makeWebhookUri',
    value: function makeWebhookUri(_ref2) {
      var pathname = _ref2.pathname,
          intermediatePath = _ref2.intermediatePath;

      var intermediateToUse = this.intermediatePath || intermediatePath;
      var tempPath = intermediateToUse || '/rest/webhooks/' + this.webhookVersion;
      var uri = _url2.default.format({
        protocol: this.protocol,
        hostname: this.host,
        port: this.port,
        pathname: '' + this.base + tempPath + pathname
      });
      return decodeURIComponent(uri);
    }

    /**
     * @typedef makeWebhookUriOptions
     * @type {object}
     * @property {string} pathname - The url after the /rest/webhooks
     * @property {string} intermediatePath - If specified will overwrite the /rest/webhooks section
     */

    /**
     * @name makeSprintQueryUri
     * @function
     * Creates a URI object for a given pathName
     * @param {object} [options] - The url after the /rest/
     */

  }, {
    key: 'makeSprintQueryUri',
    value: function makeSprintQueryUri(_ref3) {
      var pathname = _ref3.pathname,
          query = _ref3.query,
          intermediatePath = _ref3.intermediatePath;

      var intermediateToUse = this.intermediatePath || intermediatePath;
      var tempPath = intermediateToUse || '/rest/greenhopper/' + this.greenhopperVersion;
      var uri = _url2.default.format({
        protocol: this.protocol,
        hostname: this.host,
        port: this.port,
        pathname: '' + this.base + tempPath + pathname,
        query: query
      });
      return decodeURIComponent(uri);
    }

    /**
     * @typedef makeSprintQueryUriOptions
     * @type {object}
     * @property {string} pathname - The url after the /rest/api/version
     * @property {object} query - a query object
     * @property {string} intermediatePath - will overwrite the /rest/greenhopper/version section
     */

    /**
     * @typedef makeDevStatusUri
     * @function
     * Creates a URI object for a given pathname
     * @arg {pathname, query, intermediatePath} obj1
     * @param {string} pathname obj1.pathname - The url after the /rest/api/version
     * @param {object} query obj1.query - a query object
     * @param {string} intermediatePath obj1.intermediatePath - If specified will overwrite the
     * /rest/dev-status/latest/issue/detail section
     */

  }, {
    key: 'makeDevStatusUri',
    value: function makeDevStatusUri(_ref4) {
      var pathname = _ref4.pathname,
          query = _ref4.query,
          intermediatePath = _ref4.intermediatePath;

      var intermediateToUse = this.intermediatePath || intermediatePath;
      var tempPath = intermediateToUse || '/rest/dev-status/latest/issue';
      var uri = _url2.default.format({
        protocol: this.protocol,
        hostname: this.host,
        port: this.port,
        pathname: '' + this.base + tempPath + pathname,
        query: query
      });
      return decodeURIComponent(uri);
    }

    /**
     * @name makeAgile1Uri
     * @function
     * Creates a URI object for a given pathname
     * @param {UriOptions} object
     */

  }, {
    key: 'makeAgileUri',
    value: function makeAgileUri(object) {
      var intermediateToUse = this.intermediatePath || object.intermediatePath;
      var tempPath = intermediateToUse || '/rest/agile/1.0';
      var uri = _url2.default.format({
        protocol: this.protocol,
        hostname: this.host,
        port: this.port,
        pathname: '' + this.base + tempPath + object.pathname,
        query: object.query
      });
      return decodeURIComponent(uri);
    }

    /**
     * @name doRequest
     * @function
     * Does a request based on the requestOptions object
     * @param {object} requestOptions - fields on this object get posted as a request header for
     * requests to jira
     */

  }, {
    key: 'doRequest',
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(requestOptions) {
        var options, response;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                options = (0, _extends3.default)({}, this.baseOptions, requestOptions);
                _context.next = 3;
                return this.request(options);

              case 3:
                response = _context.sent;

                if (!response) {
                  _context.next = 7;
                  break;
                }

                if (!(Array.isArray(response.errorMessages) && response.errorMessages.length > 0)) {
                  _context.next = 7;
                  break;
                }

                throw new Error(response.errorMessages.join(', '));

              case 7:
                return _context.abrupt('return', response);

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function doRequest(_x2) {
        return _ref5.apply(this, arguments);
      }

      return doRequest;
    }()

    /**
     * @name findIssue
     * @function
     * Find an issue in jira
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290709)
     * @param {string} issueNumber - The issue number to search for including the project key
     * @param {string} expand - The resource expansion to return additional fields in the response
     * @param {string} fields - Comma separated list of field ids or keys to retrieve
     * @param {string} properties - Comma separated list of properties to retrieve
     * @param {boolean} fieldsByKeys - False by default, used to retrieve fields by key instead of id
     */

  }, {
    key: 'findIssue',
    value: function findIssue(issueNumber, expand, fields, properties, fieldsByKeys) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issue/' + issueNumber,
        query: {
          expand: expand || '',
          fields: fields || '*all',
          properties: properties || '*all',
          fieldsByKeys: fieldsByKeys || false
        }
      })));
    }

    /**
     * @name getUnresolvedIssueCount
     * @function
     * Get the unresolved issue count
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id288524)
     * @param {string} version - the version of your product you want to find the unresolved
     * issues of.
     */

  }, {
    key: 'getUnresolvedIssueCount',
    value: function () {
      var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(version) {
        var requestHeaders, response;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                requestHeaders = this.makeRequestHeader(this.makeUri({
                  pathname: '/version/' + version + '/unresolvedIssueCount'
                }));
                _context2.next = 3;
                return this.doRequest(requestHeaders);

              case 3:
                response = _context2.sent;
                return _context2.abrupt('return', response.issuesUnresolvedCount);

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function getUnresolvedIssueCount(_x3) {
        return _ref6.apply(this, arguments);
      }

      return getUnresolvedIssueCount;
    }()

    /**
     * @name getProject
     * @function
     * Get the Project by project key
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289232)
     * @param {string} project - key for the project
     */

  }, {
    key: 'getProject',
    value: function getProject(project) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/project/' + project
      })));
    }

    /**
       * @name createProject
       * @function
       * Create a new Project
       * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#api/2/project-createProject)
       * @param {object} project - with specs
       */

  }, {
    key: 'createProject',
    value: function createProject(project) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/project/'
      }), {
        method: 'POST',
        body: project
      }));
    }

    /** Find the Rapid View for a specified project
     * @name findRapidView
     * @function
     * @param {string} projectName - name for the project
     */

  }, {
    key: 'findRapidView',
    value: function () {
      var _ref7 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(projectName) {
        var response, rapidViewResult;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.doRequest(this.makeRequestHeader(this.makeSprintQueryUri({
                  pathname: '/rapidviews/list'
                })));

              case 2:
                response = _context3.sent;

                if (!(typeof projectName === 'undefined' || projectName === null)) {
                  _context3.next = 5;
                  break;
                }

                return _context3.abrupt('return', response.views);

              case 5:
                rapidViewResult = response.views.find(function (x) {
                  return x.name.toLowerCase() === projectName.toLowerCase();
                });
                return _context3.abrupt('return', rapidViewResult);

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function findRapidView(_x4) {
        return _ref7.apply(this, arguments);
      }

      return findRapidView;
    }()

    /** Get the most recent sprint for a given rapidViewId
     * @name getLastSprintForRapidView
     * @function
     * @param {string} rapidViewId - the id for the rapid view
     */

  }, {
    key: 'getLastSprintForRapidView',
    value: function () {
      var _ref8 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(rapidViewId) {
        var response;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.doRequest(this.makeRequestHeader(this.makeSprintQueryUri({
                  pathname: '/sprintquery/' + rapidViewId
                })));

              case 2:
                response = _context4.sent;
                return _context4.abrupt('return', response.sprints.pop());

              case 4:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function getLastSprintForRapidView(_x5) {
        return _ref8.apply(this, arguments);
      }

      return getLastSprintForRapidView;
    }()

    /** Get the issues for a rapidView / sprint
     * @name getSprintIssues
     * @function
     * @param {string} rapidViewId - the id for the rapid view
     * @param {string} sprintId - the id for the sprint
     */

  }, {
    key: 'getSprintIssues',
    value: function getSprintIssues(rapidViewId, sprintId) {
      return this.doRequest(this.makeRequestHeader(this.makeSprintQueryUri({
        pathname: '/rapid/charts/sprintreport',
        query: {
          rapidViewId: rapidViewId,
          sprintId: sprintId
        }
      })));
    }

    /** Get a list of Sprints belonging to a Rapid View
     * @name listSprints
     * @function
     * @param {string} rapidViewId - the id for the rapid view
     */

  }, {
    key: 'listSprints',
    value: function listSprints(rapidViewId) {
      return this.doRequest(this.makeRequestHeader(this.makeSprintQueryUri({
        pathname: '/sprintquery/' + rapidViewId
      })));
    }

    /** Add an issue to the project's current sprint
     * @name addIssueToSprint
     * @function
     * @param {string} issueId - the id of the existing issue
     * @param {string} sprintId - the id of the sprint to add it to
     */

  }, {
    key: 'addIssueToSprint',
    value: function addIssueToSprint(issueId, sprintId) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/sprint/' + sprintId + '/issues/add'
      }), {
        method: 'PUT',
        followAllRedirects: true,
        body: {
          issueKeys: [issueId]
        }
      }));
    }

    /** Create an issue link between two issues
     * @name issueLink
     * @function
     * @param {object} link - a link object formatted how the Jira API specifies
     */

  }, {
    key: 'issueLink',
    value: function issueLink(link) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issueLink'
      }), {
        method: 'POST',
        followAllRedirects: true,
        body: link
      }));
    }

    /** Retrieves the remote links associated with the given issue.
     * @name getRemoteLinks
     * @function
     * @param {string} issueNumber - the issue number to find remote links for.
     */

  }, {
    key: 'getRemoteLinks',
    value: function getRemoteLinks(issueNumber) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issue/' + issueNumber + '/remotelink'
      })));
    }

    /**
     * @name createRemoteLink
     * @function
     * Creates a remote link associated with the given issue.
     * @param {string} issueNumber - The issue number to create the remotelink under
     * @param {object} remoteLink - the remotelink object as specified by the Jira API
     */

  }, {
    key: 'createRemoteLink',
    value: function createRemoteLink(issueNumber, remoteLink) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issue/' + issueNumber + '/remotelink'
      }), {
        method: 'POST',
        body: remoteLink
      }));
    }

    /** Get Versions for a project
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289653)
     * @name getVersions
     * @function
     * @param {string} project - A project key to get versions for
     */

  }, {
    key: 'getVersions',
    value: function getVersions(project) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/project/' + project + '/versions'
      })));
    }

    /** Create a version
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id288232)
     * @name createVersion
     * @function
     * @param {string} version - an object of the new version
     */

  }, {
    key: 'createVersion',
    value: function createVersion(version) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/version'
      }), {
        method: 'POST',
        followAllRedirects: true,
        body: version
      }));
    }

    /** Update a version
     * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#d2e510)
     * @name updateVersion
     * @function
     * @param {string} version - an new object of the version to update
     */

  }, {
    key: 'updateVersion',
    value: function updateVersion(version) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/version/' + version.id
      }), {
        method: 'PUT',
        followAllRedirects: true,
        body: version
      }));
    }

    /** Delete a version
     * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#api/2/version-delete)
     * @name deleteVersion
     * @function
     * @param {string} versionId - the ID of the version to delete
     * @param {string} moveFixIssuesToId - when provided, existing fixVersions will be moved
     *                 to this ID. Otherwise, the deleted version will be removed from all
     *                 issue fixVersions.
     * @param {string} moveAffectedIssuesToId - when provided, existing affectedVersions will
     *                 be moved to this ID. Otherwise, the deleted version will be removed
     *                 from all issue affectedVersions.
     */

  }, {
    key: 'deleteVersion',
    value: function deleteVersion(versionId, moveFixIssuesToId, moveAffectedIssuesToId) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/version/' + versionId
      }), {
        method: 'DELETE',
        followAllRedirects: true,
        qs: {
          moveFixIssuesTo: moveFixIssuesToId,
          moveAffectedIssuesTo: moveAffectedIssuesToId
        }
      }));
    }

    /** Pass a search query to Jira
     * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#d2e4424)
     * @name searchJira
     * @function
     * @param {string} searchString - jira query string in JQL
     * @param {object} optional - object containing any of the following properties
     * @param {integer} [optional.startAt=0]: optional starting index number
     * @param {integer} [optional.maxResults=50]: optional ending index number
     * @param {array} [optional.fields]: optional array of string names of desired fields
     */

  }, {
    key: 'searchJira',
    value: function searchJira(searchString) {
      var optional = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/search'
      }), {
        method: 'POST',
        followAllRedirects: true,
        body: (0, _extends3.default)({
          jql: searchString
        }, optional)
      }));
    }

    /** Create a Jira user
     * [Jira Doc](https://docs.atlassian.com/jira/REST/cloud/#api/2/user-createUser)
     * @name createUser
     * @function
     * @param {object} user - Properly Formatted User object
     */

  }, {
    key: 'createUser',
    value: function createUser(user) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/user'
      }), {
        method: 'POST',
        followAllRedirects: true,
        body: user
      }));
    }

    /** Search user on Jira
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#d2e3756)
     * @name searchUsers
     * @function
     * @param {SearchUserOptions} options
     */

  }, {
    key: 'searchUsers',
    value: function searchUsers(_ref9) {
      var username = _ref9.username,
          startAt = _ref9.startAt,
          maxResults = _ref9.maxResults,
          includeActive = _ref9.includeActive,
          includeInactive = _ref9.includeInactive;

      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/user/search',
        query: {
          username: username,
          startAt: startAt || 0,
          maxResults: maxResults || 50,
          includeActive: includeActive || true,
          includeInactive: includeInactive || false
        }
      }), {
        followAllRedirects: true
      }));
    }

    /**
     * @typedef SearchUserOptions
     * @type {object}
     * @property {string} username - A query string used to search username, name or e-mail address
     * @property {integer} [startAt=0] - The index of the first user to return (0-based)
     * @property {integer} [maxResults=50] - The maximum number of users to return
     * @property {boolean} [includeActive=true] - If true, then active users are included
     * in the results
     * @property {boolean} [includeInactive=false] - If true, then inactive users
     * are included in the results
     */

    /** Get all users in group on Jira
     * @name getUsersInGroup
     * @function
     * @param {string} groupname - A query string used to search users in group
     * @param {integer} [startAt=0] - The index of the first user to return (0-based)
     * @param {integer} [maxResults=50] - The maximum number of users to return (defaults to 50).
     */

  }, {
    key: 'getUsersInGroup',
    value: function getUsersInGroup(groupname) {
      var startAt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var maxResults = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 50;

      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/group',
        query: {
          groupname: groupname,
          expand: 'users[' + startAt + ':' + maxResults + ']'
        }
      }), {
        followAllRedirects: true
      }));
    }

    /** Get issues related to a user
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id296043)
     * @name getUsersIssues
     * @function
     * @param {string} username - username of user to search for
     * @param {boolean} open - determines if only open issues should be returned
     */

  }, {
    key: 'getUsersIssues',
    value: function getUsersIssues(username, open) {
      var openJql = open ? ' AND status in (Open, \'In Progress\', Reopened)' : '';
      return this.searchJira('assignee = ' + username.replace('@', '\\u0040') + openJql, {});
    }

    /** Add issue to Jira
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290028)
     * @name addNewIssue
     * @function
     * @param {object} issue - Properly Formatted Issue object
     */

  }, {
    key: 'addNewIssue',
    value: function addNewIssue(issue) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issue'
      }), {
        method: 'POST',
        followAllRedirects: true,
        body: issue
      }));
    }

    /** Add a user as a watcher on an issue
     * @name addWatcher
     * @function
     * @param {string} issueKey - the key of the existing issue
     * @param {string} username - the jira username to add as a watcher to the issue
     */

  }, {
    key: 'addWatcher',
    value: function addWatcher(issueKey, username) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issue/' + issueKey + '/watchers'
      }), {
        method: 'POST',
        followAllRedirects: true,
        body: (0, _stringify2.default)(username)
      }));
    }

    /** Delete issue from Jira
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290791)
     * @name deleteIssue
     * @function
     * @param {string} issueId - the Id of the issue to delete
     */

  }, {
    key: 'deleteIssue',
    value: function deleteIssue(issueId) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issue/' + issueId
      }), {
        method: 'DELETE',
        followAllRedirects: true
      }));
    }

    /** Update issue in Jira
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290878)
     * @name updateIssue
     * @function
     * @param {string} issueId - the Id of the issue to delete
     * @param {object} issueUpdate - update Object as specified by the rest api
     */

  }, {
    key: 'updateIssue',
    value: function updateIssue(issueId, issueUpdate) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issue/' + issueId
      }), {
        body: issueUpdate,
        method: 'PUT',
        followAllRedirects: true
      }));
    }

    /** List Components
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
     * @name listComponents
     * @function
     * @param {string} project - key for the project
     */

  }, {
    key: 'listComponents',
    value: function listComponents(project) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/project/' + project + '/components'
      })));
    }

    /** Add component to Jira
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290028)
     * @name addNewComponent
     * @function
     * @param {object} component - Properly Formatted Component
     */

  }, {
    key: 'addNewComponent',
    value: function addNewComponent(component) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/component'
      }), {
        method: 'POST',
        followAllRedirects: true,
        body: component
      }));
    }

    /** Delete component from Jira
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290791)
     * @name deleteComponent
     * @function
     * @param {string} componentId - the Id of the component to delete
     */

  }, {
    key: 'deleteComponent',
    value: function deleteComponent(componentId) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/component/' + componentId
      }), {
        method: 'DELETE',
        followAllRedirects: true
      }));
    }

    /** Create custom Jira field
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#api/2/field-createCustomField)
     * @name createCustomField
     * @function
     * @param {object} field - Properly formatted Field object
     */

  }, {
    key: 'createCustomField',
    value: function createCustomField(field) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/field'
      }), {
        method: 'POST',
        followAllRedirects: true,
        body: field
      }));
    }

    /** List all fields custom and not that jira knows about.
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
     * @name listFields
     * @function
     */

  }, {
    key: 'listFields',
    value: function listFields() {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/field'
      })));
    }

    /** Add an option for a select list issue field.
    * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#api/2/field/{fieldKey}/option-createOption)
    * @name createFieldOption
    * @function
    * @param {string} fieldKey - the key of the select list field
    * @param {object} option - properly formatted Option object
    */

  }, {
    key: 'createFieldOption',
    value: function createFieldOption(fieldKey, option) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/field/' + fieldKey + '/option'
      }), {
        method: 'POST',
        followAllRedirects: true,
        body: option
      }));
    }

    /** Returns all options defined for a select list issue field.
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#api/2/field/{fieldKey}/option-getAllOptions)
     * @name listFieldOptions
     * @function
     * @param {string} fieldKey - the key of the select list field
     */

  }, {
    key: 'listFieldOptions',
    value: function listFieldOptions(fieldKey) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/field/' + fieldKey + '/option'
      })));
    }

    /** Creates or updates an option for a select list issue field.
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#api/2/field/{fieldKey}/option-putOption)
     * @name upsertFieldOption
     * @function
     * @param {string} fieldKey - the key of the select list field
     * @param {string} optionId - the id of the modified option
     * @param {object} option - properly formatted Option object
     */

  }, {
    key: 'upsertFieldOption',
    value: function upsertFieldOption(fieldKey, optionId, option) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/field/' + fieldKey + '/option/' + optionId
      }), {
        method: 'PUT',
        followAllRedirects: true,
        body: option
      }));
    }

    /** Returns an option for a select list issue field.
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#api/2/field/{fieldKey}/option-getOption)
     * @name getFieldOption
     * @function
     * @param {string} fieldKey - the key of the select list field
     * @param {string} optionId - the id of the option
     */

  }, {
    key: 'getFieldOption',
    value: function getFieldOption(fieldKey, optionId) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/field/' + fieldKey + '/option/' + optionId
      })));
    }

    /** Deletes an option from a select list issue field.
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#api/2/field/{fieldKey}/option-delete)
     * @name deleteFieldOption
     * @function
     * @param {string} fieldKey - the key of the select list field
     * @param {string} optionId - the id of the deleted option
     */

  }, {
    key: 'deleteFieldOption',
    value: function deleteFieldOption(fieldKey, optionId) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/field/' + fieldKey + '/option/' + optionId
      }), {
        method: 'DELETE',
        followAllRedirects: true
      }));
    }

    /**
     * @name getIssueProperty
     * @function
     * Get Property of Issue by Issue and Property Id
     * [Jira Doc](https://docs.atlassian.com/jira/REST/cloud/#api/2/issue/{issueIdOrKey}/properties-getProperty)
     * @param {string} issueNumber - The issue number to search for including the project key
     * @param {string} property - The property key to search for
     */

  }, {
    key: 'getIssueProperty',
    value: function getIssueProperty(issueNumber, property) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issue/' + issueNumber + '/properties/' + property
      })));
    }

    /** List all priorities jira knows about
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
     * @name listPriorities
     * @function
     */

  }, {
    key: 'listPriorities',
    value: function listPriorities() {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/priority'
      })));
    }

    /** List Transitions for a specific issue that are available to the current user
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
     * @name listTransitions
     * @function
     * @param {string} issueId - get transitions available for the issue
     */

  }, {
    key: 'listTransitions',
    value: function listTransitions(issueId) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issue/' + issueId + '/transitions',
        query: {
          expand: 'transitions.fields'
        }
      })));
    }

    /** Transition issue in Jira
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
     * @name transitionsIssue
     * @function
     * @param {string} issueId - the Id of the issue to delete
     * @param {object} issueTransition - transition object from the jira rest API
     */

  }, {
    key: 'transitionIssue',
    value: function transitionIssue(issueId, issueTransition) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issue/' + issueId + '/transitions'
      }), {
        body: issueTransition,
        method: 'POST',
        followAllRedirects: true
      }));
    }

    /** List all Viewable Projects
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289193)
     * @name listProjects
     * @function
     */

  }, {
    key: 'listProjects',
    value: function listProjects() {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/project'
      })));
    }

    /** Add a comment to an issue
     * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#id108798)
     * @name addComment
     * @function
     * @param {string} issueId - Issue to add a comment to
     * @param {string} comment - string containing comment
     */

  }, {
    key: 'addComment',
    value: function addComment(issueId, comment) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issue/' + issueId + '/comment'
      }), {
        body: {
          body: comment
        },
        method: 'POST',
        followAllRedirects: true
      }));
    }

    /** Update comment for an issue
     * [Jira Doc](https://docs.atlassian.com/jira/REST/cloud/#api/2/issue-updateComment)
     * @name updateComment
     * @function
     * @param {string} issueId - Issue with the comment
     * @param {string} commentId - Comment that is updated
     * @param {string} comment - string containing new comment
     * @param {object} [options={}] - extra options
     */

  }, {
    key: 'updateComment',
    value: function updateComment(issueId, commentId, comment) {
      var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issue/' + issueId + '/comment/' + commentId
      }), {
        body: (0, _extends3.default)({
          body: comment
        }, options),
        method: 'PUT',
        followAllRedirects: true
      }));
    }

    /** Add a worklog to a project
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id291617)
     * @name addWorklog
     * @function
     * @param {string} issueId - Issue to add a worklog to
     * @param {object} worklog - worklog object from the rest API
     * @param {object} newEstimate - the new value for the remaining estimate field
     */

  }, {
    key: 'addWorklog',
    value: function addWorklog(issueId, worklog) {
      var newEstimate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

      var query = { adjustEstimate: 'auto' };
      if (newEstimate) {
        query.adjustEstimate = 'new';
        query.newEstimate = newEstimate;
      }

      var header = {
        uri: this.makeUri({
          pathname: '/issue/' + issueId + '/worklog',
          query: query
        }),
        body: worklog,
        method: 'POST',
        'Content-Type': 'application/json',
        json: true
      };

      return this.doRequest(header);
    }

    /** Delete worklog from issue
     * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#d2e1673)
     * @name deleteWorklog
     * @function
     * @param {string} issueId - the Id of the issue to delete
     * @param {string} worklogId - the Id of the worklog in issue to delete
     */

  }, {
    key: 'deleteWorklog',
    value: function deleteWorklog(issueId, worklogId) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issue/' + issueId + '/worklog/' + worklogId
      }), {
        method: 'DELETE',
        followAllRedirects: true
      }));
    }

    /** List all Issue Types jira knows about
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id295946)
     * @name listIssueTypes
     * @function
     */

  }, {
    key: 'listIssueTypes',
    value: function listIssueTypes() {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issuetype'
      })));
    }

    /** Register a webhook
     * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
     * @name registerWebhook
     * @function
     * @param {object} webhook - properly formatted webhook
     */

  }, {
    key: 'registerWebhook',
    value: function registerWebhook(webhook) {
      return this.doRequest(this.makeRequestHeader(this.makeWebhookUri({
        pathname: '/webhook'
      }), {
        method: 'POST',
        body: webhook
      }));
    }

    /** List all registered webhooks
     * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
     * @name listWebhooks
     * @function
     */

  }, {
    key: 'listWebhooks',
    value: function listWebhooks() {
      return this.doRequest(this.makeRequestHeader(this.makeWebhookUri({
        pathname: '/webhook'
      })));
    }

    /** Get a webhook by its ID
     * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
     * @name getWebhook
     * @function
     * @param {string} webhookID - id of webhook to get
     */

  }, {
    key: 'getWebhook',
    value: function getWebhook(webhookID) {
      return this.doRequest(this.makeRequestHeader(this.makeWebhookUri({
        pathname: '/webhook/' + webhookID
      })));
    }

    /** Delete a registered webhook
     * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
     * @name issueLink
     * @function
     * @param {string} webhookID - id of the webhook to delete
     */

  }, {
    key: 'deleteWebhook',
    value: function deleteWebhook(webhookID) {
      return this.doRequest(this.makeRequestHeader(this.makeWebhookUri({
        pathname: '/webhook/' + webhookID
      }), {
        method: 'DELETE'
      }));
    }

    /** Describe the currently authenticated user
     * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id2e865)
     * @name getCurrentUser
     * @function
     */

  }, {
    key: 'getCurrentUser',
    value: function getCurrentUser() {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/myself'
      })));
    }

    /** Retrieve the backlog of a certain Rapid View
     * @name getBacklogForRapidView
     * @function
     * @param {string} rapidViewId - rapid view id
     */

  }, {
    key: 'getBacklogForRapidView',
    value: function getBacklogForRapidView(rapidViewId) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/xboard/plan/backlog/data',
        query: {
          rapidViewId: rapidViewId
        }
      })));
    }

    /** Add attachment to a Issue
     * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#api/2/issue/{issueIdOrKey}/attachments-addAttachment)
     * @name addAttachmentOnIssue
     * @function
     * @param {string} issueId - issue id
     * @param {object} readStream - readStream object from fs
     */

  }, {
    key: 'addAttachmentOnIssue',
    value: function addAttachmentOnIssue(issueId, readStream) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issue/' + issueId + '/attachments'
      }), {
        method: 'POST',
        headers: {
          'X-Atlassian-Token': 'nocheck'
        },
        formData: {
          file: readStream
        }
      }));
    }

    /** Notify people related to issue
     * [Jira Doc](https://docs.atlassian.com/jira/REST/cloud/#api/2/issue-notify)
     * @name issueNotify
     * @function
     * @param {string} issueId - issue id
     * @param {object} notificationBody - properly formatted body
     */

  }, {
    key: 'issueNotify',
    value: function issueNotify(issueId, notificationBody) {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/issue/' + issueId + '/notify'
      }), {
        method: 'POST',
        body: notificationBody
      }));
    }

    /** Get list of possible statuses
     * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#api/2/status-getStatuses)
     * @name listStatus
     * @function
     */

  }, {
    key: 'listStatus',
    value: function listStatus() {
      return this.doRequest(this.makeRequestHeader(this.makeUri({
        pathname: '/status'
      })));
    }

    /** Get a Dev-Status summary by issue ID
     * @name getDevStatusSummary
     * @function
     * @param {string} issueId - id of issue to get
     */

  }, {
    key: 'getDevStatusSummary',
    value: function getDevStatusSummary(issueId) {
      return this.doRequest(this.makeRequestHeader(this.makeDevStatusUri({
        pathname: '/summary',
        query: {
          issueId: issueId
        }
      })));
    }

    /** Get a Dev-Status detail by issue ID
     * @name getDevStatusDetail
     * @function
     * @param {string} issueId - id of issue to get
     * @param {string} applicationType - type of application (stash, bitbucket)
     * @param {string} dataType - info to return (repository, pullrequest)
     */

  }, {
    key: 'getDevStatusDetail',
    value: function getDevStatusDetail(issueId, applicationType, dataType) {
      return this.doRequest(this.makeRequestHeader(this.makeDevStatusUri({
        pathname: '/detail',
        query: {
          issueId: issueId,
          applicationType: applicationType,
          dataType: dataType
        }
      })));
    }

    /** Move issues to backlog
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/backlog-moveIssuesToBacklog)
     * @name moveToBacklog
     * @function
     * @param {array} issues - id or key of issues to get
     */

  }, {
    key: 'moveToBacklog',
    value: function moveToBacklog(issues) {
      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/backlog/issue'
      }), {
        method: 'POST',
        body: {
          issues: issues
        }
      }));
    }

    /** Get all boards
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board-getAllBoards)
     * @name getAllBoards
     * @function
     * @param {number} [startAt=0] - The starting index of the returned boards.
     * @param {number} [maxResults=50] - The maximum number of boards to return per page.
     * @param {string} [type] - Filters results to boards of the specified type.
     * @param {string} [name] - Filters results to boards that match the specified name.
     * @param {string} [projectKeyOrId] - Filters results to boards that are relevant to a project.
     */

  }, {
    key: 'getAllBoards',
    value: function getAllBoards() {
      var startAt = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var maxResults = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 50;
      var type = arguments[2];
      var name = arguments[3];
      var projectKeyOrId = arguments[4];

      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board',
        query: {
          startAt: startAt,
          maxResults: maxResults,
          type: type,
          name: name,
          projectKeyOrId: projectKeyOrId
        }
      })));
    }

    /** Create Board
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board-createBoard)
     * @name createBoard
     * @function
     * @param {object} boardBody - Board name, type and filter Id is required.
     * @param {string} boardBody.type - Valid values: scrum, kanban
     * @param {string} boardBody.name - Must be less than 255 characters.
     * @param {string} boardBody.filterId - Id of a filter that the user has permissions to view.
     */

  }, {
    key: 'createBoard',
    value: function createBoard(boardBody) {
      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board'
      }), {
        method: 'POST',
        body: boardBody
      }));
    }

    /** Get Board
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board-getBoard)
     * @name getBoard
     * @function
     * @param {string} boardId - Id of board to retrieve
     */

  }, {
    key: 'getBoard',
    value: function getBoard(boardId) {
      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId
      })));
    }

    /** Delete Board
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board-deleteBoard)
     * @name deleteBoard
     * @function
     * @param {string} boardId - Id of board to retrieve
     */

  }, {
    key: 'deleteBoard',
    value: function deleteBoard(boardId) {
      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId
      }), {
        method: 'DELETE'
      }));
    }

    /** Get issues for backlog
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board-getIssuesForBacklog)
     * @name getIssuesForBacklog
     * @function
     * @param {string} boardId - Id of board to retrieve
     * @param {number} [startAt=0] - The starting index of the returned issues. Base index: 0.
     * @param {number} [maxResults=50] - The maximum number of issues to return per page. Default: 50.
     * @param {string} [jql] - Filters results using a JQL query.
     * @param {boolean} [validateQuery] - Specifies whether to validate the JQL query or not.
     * Default: true.
     * @param {string} [fields] - The list of fields to return for each issue.
     */

  }, {
    key: 'getIssuesForBacklog',
    value: function getIssuesForBacklog(boardId) {
      var startAt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var maxResults = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 50;
      var jql = arguments[3];
      var validateQuery = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
      var fields = arguments[5];

      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId + '/backlog',
        query: {
          startAt: startAt,
          maxResults: maxResults,
          jql: jql,
          validateQuery: validateQuery,
          fields: fields
        }
      })));
    }

    /** Get Configuration
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board-getConfiguration)
     * @name getConfiguration
     * @function
     * @param {string} boardId - Id of board to retrieve
     */

  }, {
    key: 'getConfiguration',
    value: function getConfiguration(boardId) {
      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId + '/configuration'
      })));
    }

    /** Get issues for board
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board-getIssuesForBoard)
     * @name getIssuesForBoard
     * @function
     * @param {string} boardId - Id of board to retrieve
     * @param {number} [startAt=0] - The starting index of the returned issues. Base index: 0.
     * @param {number} [maxResults=50] - The maximum number of issues to return per page. Default: 50.
     * @param {string} [jql] - Filters results using a JQL query.
     * @param {boolean} [validateQuery] - Specifies whether to validate the JQL query or not.
     * Default: true.
     * @param {string} [fields] - The list of fields to return for each issue.
     */

  }, {
    key: 'getIssuesForBoard',
    value: function getIssuesForBoard(boardId) {
      var startAt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var maxResults = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 50;
      var jql = arguments[3];
      var validateQuery = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
      var fields = arguments[5];

      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId + '/issue',
        query: {
          startAt: startAt,
          maxResults: maxResults,
          jql: jql,
          validateQuery: validateQuery,
          fields: fields
        }
      })));
    }

    /** Get Epics
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/epic-getEpics)
     * @name getEpics
     * @function
     * @param {string} boardId - Id of board to retrieve
     * @param {number} [startAt=0] - The starting index of the returned epics. Base index: 0.
     * @param {number} [maxResults=50] - The maximum number of epics to return per page. Default: 50.
     * @param {string} [done] - Filters results to epics that are either done or not done.
     * Valid values: true, false.
     */

  }, {
    key: 'getEpics',
    value: function getEpics(boardId) {
      var startAt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var maxResults = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 50;
      var done = arguments[3];

      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId + '/epic',
        query: {
          startAt: startAt,
          maxResults: maxResults,
          done: done
        }
      })));
    }

    /** Get board issues for epic
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/epic-getIssuesForEpic)
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/epic-getIssuesWithoutEpic)
     * @name getBoardIssuesForEpic
     * @function
     * @param {string} boardId - Id of board to retrieve
     * @param {string} epicId - Id of epic to retrieve, specify 'none' to get issues without an epic.
     * @param {number} [startAt=0] - The starting index of the returned issues. Base index: 0.
     * @param {number} [maxResults=50] - The maximum number of issues to return per page. Default: 50.
     * @param {string} [jql] - Filters results using a JQL query.
     * @param {boolean} [validateQuery] - Specifies whether to validate the JQL query or not.
     * Default: true.
     * @param {string} [fields] - The list of fields to return for each issue.
     */

  }, {
    key: 'getBoardIssuesForEpic',
    value: function getBoardIssuesForEpic(boardId, epicId) {
      var startAt = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var maxResults = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 50;
      var jql = arguments[4];
      var validateQuery = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : true;
      var fields = arguments[6];

      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId + '/epic/' + epicId + '/issue',
        query: {
          startAt: startAt,
          maxResults: maxResults,
          jql: jql,
          validateQuery: validateQuery,
          fields: fields
        }
      })));
    }

    /** Get Projects
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/project-getProjects)
     * @name getProjects
     * @function
     * @param {string} boardId - Id of board to retrieve
     * @param {number} [startAt=0] - The starting index of the returned projects. Base index: 0.
     * @param {number} [maxResults=50] - The maximum number of projects to return per page.
     * Default: 50.
     */

  }, {
    key: 'getProjects',
    value: function getProjects(boardId) {
      var startAt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var maxResults = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 50;

      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId + '/project',
        query: {
          startAt: startAt,
          maxResults: maxResults
        }
      })));
    }

    /** Get Projects Full
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/project-getProjectsFull)
     * @name getProjectsFull
     * @function
     * @param {string} boardId - Id of board to retrieve
     */

  }, {
    key: 'getProjectsFull',
    value: function getProjectsFull(boardId) {
      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId + '/project/full'
      })));
    }

    /** Get Board Properties Keys
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/properties-getPropertiesKeys)
     * @name getBoardPropertiesKeys
     * @function
     * @param {string} boardId - Id of board to retrieve
     */

  }, {
    key: 'getBoardPropertiesKeys',
    value: function getBoardPropertiesKeys(boardId) {
      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId + '/properties'
      })));
    }

    /** Delete Board Property
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/properties-deleteProperty)
     * @name deleteBoardProperty
     * @function
     * @param {string} boardId - Id of board to retrieve
     * @param {string} propertyKey - Id of property to delete
     */

  }, {
    key: 'deleteBoardProperty',
    value: function deleteBoardProperty(boardId, propertyKey) {
      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId + '/properties/' + propertyKey
      }), {
        method: 'DELETE'
      }));
    }

    /** Set Board Property
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/properties-setProperty)
     * @name setBoardProperty
     * @function
     * @param {string} boardId - Id of board to retrieve
     * @param {string} propertyKey - Id of property to delete
     * @param {string} body - value to set, for objects make sure to stringify first
     */

  }, {
    key: 'setBoardProperty',
    value: function setBoardProperty(boardId, propertyKey, body) {
      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId + '/properties/' + propertyKey
      }), {
        method: 'PUT',
        body: body
      }));
    }

    /** Get Board Property
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/properties-getProperty)
     * @name getBoardProperty
     * @function
     * @param {string} boardId - Id of board to retrieve
     * @param {string} propertyKey - Id of property to retrieve
     */

  }, {
    key: 'getBoardProperty',
    value: function getBoardProperty(boardId, propertyKey) {
      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId + '/properties/' + propertyKey
      })));
    }

    /** Get All Sprints
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/sprint-getAllSprints)
     * @name getAllSprints
     * @function
     * @param {string} boardId - Id of board to retrieve
     * @param {number} [startAt=0] - The starting index of the returned sprints. Base index: 0.
     * @param {number} [maxResults=50] - The maximum number of sprints to return per page.
     * Default: 50.
     * @param {string} [state] - Filters results to sprints in specified states.
     * Valid values: future, active, closed.
     */

  }, {
    key: 'getAllSprints',
    value: function getAllSprints(boardId) {
      var startAt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var maxResults = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 50;
      var state = arguments[3];

      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId + '/sprint',
        query: {
          startAt: startAt,
          maxResults: maxResults,
          state: state
        }
      })));
    }

    /** Get Board issues for sprint
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/sprint-getIssuesForSprint)
     * @name getBoardIssuesForSprint
     * @function
     * @param {string} boardId - Id of board to retrieve
     * @param {string} sprintId - Id of sprint to retrieve
     * @param {number} [startAt=0] - The starting index of the returned issues. Base index: 0.
     * @param {number} [maxResults=50] - The maximum number of issues to return per page. Default: 50.
     * @param {string} [jql] - Filters results using a JQL query.
     * @param {boolean} [validateQuery] - Specifies whether to validate the JQL query or not.
     * Default: true.
     * @param {string} [fields] - The list of fields to return for each issue.
     */

  }, {
    key: 'getBoardIssuesForSprint',
    value: function getBoardIssuesForSprint(boardId, sprintId) {
      var startAt = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var maxResults = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 50;
      var jql = arguments[4];
      var validateQuery = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : true;
      var fields = arguments[6];

      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId + '/sprint/' + sprintId + '/issue',
        query: {
          startAt: startAt,
          maxResults: maxResults,
          jql: jql,
          validateQuery: validateQuery,
          fields: fields
        }
      })));
    }

    /** Get All Versions
     * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/version-getAllVersions)
     * @name getAllVersions
     * @function
     * @param {string} boardId - Id of board to retrieve
     * @param {number} [startAt=0] - The starting index of the returned versions. Base index: 0.
     * @param {number} [maxResults=50] - The maximum number of versions to return per page.
     * Default: 50.
     * @param {string} [released] - Filters results to versions that are either released or
     * unreleased.Valid values: true, false.
     */

  }, {
    key: 'getAllVersions',
    value: function getAllVersions(boardId) {
      var startAt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var maxResults = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 50;
      var released = arguments[3];

      return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
        pathname: '/board/' + boardId + '/version',
        query: {
          startAt: startAt,
          maxResults: maxResults,
          released: released
        }
      })));
    }
  }]);
  return JiraApi;
}();

exports.default = JiraApi;
module.exports = exports['default'];