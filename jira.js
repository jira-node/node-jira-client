// # JavaScript JIRA API for node.js
// 
// A node.js module, which provides an object oriented wrapper for the JIRA REST API.
// 
// This library is built to support version `2.0.alpha1` of the JIRA REST API.
// 
// JIRA REST API documentation can be found [here](http://docs.atlassian.com/jira/REST/latest/)
// 
// ## Installation
// 
//   Install with the node package manager [npm](http://npmjs.org):
// 
//     $ npm install jira
// 
// or
// 
//   Install via git clone:
// 
//     $ git clone git://git://github.com/steves/node-jira.git
//     $ cd node-jira
//     $ npm install
// 
// ## Example
// 
// Find the status of an issue.
// 
//     JiraApi = require('jira').JiraApi;
// 
//     var jira = new JiraApi('https', config.host, 
//         config.port, config.user, config.password, '2.0.alpha1');
//     jira.findIssue(issueNumber, function(error, issue) {
//         console.log('Status: ' + issue.fields.status.value.name);
//     });
// 
// Currently there is no explicit login call necessary as each API call makes a call to `login` before processing. This causes a lot of unnecessary logins and will be cleaned up in a future version.
// 
// ## Implemented APIs
// 
// * Authentication
// * Pulling an issue
// * Pulling a project
// * Pulling unresolved issues count for a specific version
// * Issue linking
// * Pulling versions
// * Adding a new version
// * Find a Rapid View based on project name
// * Get the latest Green Hopper sprint for a Rapid View
// * Add an issue to a sprint
// 
// ## TODO
// 
// * API docs
//  * Better most methods are currently undocumented
// * Tests
// * Refactor currently implemented APIs to be more Object Oriented
// * Refactor to make use of built-in node.js events and classes
// * Auto-redirect between `http` and `https` following headers
//
//
var http = require('http'),
    url = require('url'),
    request = require('request');


var JiraApi = exports.JiraApi = function(protocol, host, port, username, password, apiVersion) {
    this.protocol = protocol;
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
    this.apiVersion = apiVersion;

    this.cookies = [];
};

(function() {
    this.login = function(callback) {
        console.log("Attempting to log in to JIRA");

        var options = {
            uri: url.format({
                protocol:  this.protocol,
                host: this.host,
                port: this.port,
                pathname: 'rest/auth/1/session'
            }),
            method: 'POST',
            json: true,
            body: {
                'username': this.username,
                'password': this.password
            }
        };

        var self = this;
        request(options, function(error, response, body) {
            if (response.statusCode === 401) {
                callback('Failed to log in to JIRA due to authentication error.');
                return;
            }

            if (response.statusCode !== 200) {
                callback(response.statusCode + ': Unable to connect to JIRA during login.');
                return;
            }

            self.cookies = [];
            if (response.headers['set-cookie']) {
                self.cookies = response.headers['set-cookie'];
            }

            console.log("Logged in to JIRA successfully.");
            callback(null);
        });
    };

    
    // ## Find an issue in jira ##
    // ### Takes ###
    //
    // *  issueNumber: the issueNumber to find
    // *  callback: for when it's done
    //   
    // ### Returns ###
    //
    // *  error: string of the error
    // *  issue: an object of the issue
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290709)
    this.findIssue = function(issueNumber, callback) {
        var self = this;
        this.login(function() {
            var options = {
                uri: url.format({
                    protocol: self.protocol,
                    host: self.host,
                    port: self.port,
                    pathname: 'rest/api/' + self.apiVersion + '/issue/' + issueNumber
                }),
                method: 'GET',
                headers: {
                    Cookie: self.cookies.join(';')
                }
            };

            request(options, function(error, response, body) {
                if (response.statusCode === 404) {
                    callback('Invalid issue number.');
                    return;
                }

                if (response.statusCode !== 200) {
                    callback(response.statusCode + ': Unable to connect to JIRA during findIssueStatus.');
                    return;
                }

                callback(null, JSON.parse(body));

            });
        });
    };

    // ## Get the unresolved issue count ##
    // ### Takes ###
    //
    // *  version: version of your product that you want issues against
    // *  callback: function for when it's done     
    //
    // ### Returns ###
    // *  error: string with the error code
    // *  count: count of unresolved issues for requested version
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id288524)
    
    this.getUnresolvedIssueCount = function(version, callback) {
        var self = this;
        this.login(function() {
            var options = {
                uri: url.format({
                    protocol: self.protocol,
                    host: self.host,
                    port: self.port,
                    pathname: 'rest/api/' + self.apiVersion + '/version/' + version + '/unresolvedIssueCount'
                }),
                method: 'GET',
                headers: {
                    Cookie: self.cookies.join(';')
                }
            };

            request(options, function(error, response, body) {
                if (response.statusCode === 404) {
                    callback('Invalid version.');
                    return;
                }

                if (response.statusCode !== 200) {
                    callback(response.statusCode + ': Unable to connect to JIRA during findIssueStatus.');
                    return;
                }

                body = JSON.parse(body);
                callback(null, body.issuesUnresolvedCount);
            });
        });
    };

    // ## Get the Project by project key ##
    // ### Takes ###
    //
    // *  project: key for the project
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error: string of the error
    // *  project: the json object representing the entire project
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289232)

    this.getProject = function(project, callback) {
        var self = this;
        this.login(function() {
            var options = {
                uri: url.format({
                    protocol: self.protocol,
                    host: self.host,
                    port: self.port,
                    pathname: 'rest/api/' + self.apiVersion + '/project/' + project
                }),
                method: 'GET',
                headers: {
                    Cookie: self.cookies.join(';')
                }
            };

            request(options, function(error, response, body) {
                if (response.statusCode === 404) {
                    callback('Invalid project.');
                    return;
                }

                if (response.statusCode !== 200) {
                    callback(response.statusCode + ': Unable to connect to JIRA during getProject.');
                    return;
                }

                body = JSON.parse(body);
                callback(null, body);
            });
        });
    };

    // ## Find the Rapid View for a specified project ##
    // ### Takes ###
    //
    // *  projectName: name for the project
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error: string of the error
    // *  rapidView: rapid view matching the projectName
    
    /**
     * Finds the Rapid View that belongs to a specified project.
     *
     * @param projectName
     * @param callback
     */
    this.findRapidView = function(projectName, callback) {
      var self = this;
      this.login(function() {
        var options = {
          uri: url.format({
            protocol: self.protocol,
            host: self.host,
            port: self.port,
            pathname: 'rest/greenhopper/' + self.apiVersion + '/rapidviews/list'
          }),
          method: 'GET',
          headers: {
            Cookie: self.cookies.join(';')
          },
          json: true,
        };

        request(options, function(error, response, body) {
          if (response.statusCode === 404) {
            callback('Invalid URL');
            return;
          }

          if (response.statusCode !== 200) {
            callback(response.statusCode + ': Unable to connect to JIRA during rapidView search.');
            return;
          }

          if (response.body !== null) {
            var rapidViews = response.body.views;
            for (var i = 0; i < rapidViews.length; i++) {
              if(rapidViews[i].name.toLowerCase() === projectName.toLowerCase()) {
                callback(null, rapidViews[i]);
                return;
              }
            }
          }
        });
      });
    };

    // ## Get a list of Sprints belonging to a Rapid View ##
    // ### Takes ###
    //
    // *  rapidViewId: the id for the rapid view
    // *  callback: for when it's done
    //
    // ### Returns ###
    //
    // *  error: string with the error
    // *  sprints: the ?array? of sprints
    /**
     * Returns a list of sprints belonging to a Rapid View.
     *
     * @param rapidView ID
     * @param callback
     */
    this.getLastSprintForRapidView = function(rapidViewId, callback) {
      var self = this;
      this.login(function() {
        var options = {
          uri: url.format({
            protocol: self.protocol,
            host: self.host,
            port: self.port,
            pathname: 'rest/greenhopper/' + self.apiVersion + '/sprints/' + rapidViewId
          }),
          method: 'GET',
          headers: {
            Cookie: self.cookies.join(';')
          },
          json:true,
        };

        request(options, function(error, response, body) {
          if (response.statusCode === 404) {
            callback('Invalid URL');
            return;
          }

          if (response.statusCode !== 200) {
            callback(response.statusCode + ': Unable to connect to JIRA during sprints search.');
            return;
          }

          if (response.body !== null) {
            var sprints = response.body.sprints;
            callback(null, sprints.pop());
            return;
          }
        });
      });
    };

    // ## Add an issue to the project's current sprint ##
    // ### Takes ###
    //
    // *  issueId: the id of the existing issue
    // *  sprintId: the id of the sprint to add it to
    // *  callback: for when it's done
    //
    // ### Returns ###
    // 
    // *  error: string of the error
    //
    //
    // **does this callback if there's success?**
    /**
     * Adds a given issue to a project's current sprint
     *
     * @param issueId
     * @param sprintId
     * @param callback
     */
    this.addIssueToSprint = function(issueId, sprintId, callback) {
      var self = this;
      this.login(function() {
        var options = {
          uri: url.format({
            protocol: self.protocol,
            host: self.host,
            port: self.port,
            pathname: 'rest/greenhopper/' + self.apiVersion + '/sprint/' + sprintId + '/issues/add'
          }),
          method: 'PUT',
          headers: {
            Cookie: self.cookies.join(';')
          },
          json:true,
          body: {
            issueKeys: [issueId]
          }
        };

        console.log(options.uri);
        request(options, function(error, response, body) {
          if (response.statusCode === 404) {
            callback('Invalid URL');
            return;
          }

          if (response.statusCode !== 204) {
            callback(response.statusCode + ': Unable to connect to JIRA to add to sprint.');
            return;
          }

        });
      });
    };

    // ## Create an issue link between two issues ##
    // ### Takes ###
    // 
    // *  link: a link object
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error: string if there was an issue, null if success 
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id296682)
    /**
     * Creates an issue link between two issues. Link should follow the below format:
     *
     * {
     *   'linkType': 'Duplicate',
     *   'fromIssueKey': 'HSP-1',
     *   'toIssueKey': 'MKY-1',
     *   'comment': {
     *     'body': 'Linked related issue!',
     *     'visibility': {
     *       'type': 'GROUP',
     *       'value': 'jira-users'
     *     }
     *   }
     * }
     *
     * @param link
     * @param errorCallback
     * @param successCallback
     */
    this.issueLink = function(link, callback) {
        var self = this;
        this.login(function() {
            var options = {
                uri: url.format({
                    protocol: self.protocol,
                    host: self.host,
                    port: self.port,
                    pathname: 'rest/api/' + self.apiVersion + '/issueLink'
                }),
                method: 'POST',
                headers: {
                    Cookie: self.cookies.join(';')
                },
                json: true,
                body: link
            };

            request(options, function(error, response, body) {
                if (response.statusCode === 404) {
                    callback('Invalid project.');
                    return;
                }

                if (response.statusCode !== 200) {
                    callback(response.statusCode + ': Unable to connect to JIRA during issueLink.');
                    return;
                }

                callback(null);
            });
        });
    };

    // ## Get Versions for a project ##
    // ### Takes ###
    // *  project: A project key
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error: a string with the error
    // *  versions: array of the versions for a product
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289653)

    this.getVersions = function(project, callback) {
        var self = this;
        this.login(function() {
            var options = {
                uri: url.format({
                    protocol: self.protocol,
                    host: self.host,
                    port: self.port,
                    pathname: 'rest/api/' + self.apiVersion + '/project/' + project + '/versions'
                }),
                method: 'GET',
                headers: {
                    Cookie: self.cookies.join(';')
                }
            };

            request(options, function(error, response, body) {
                if (response.statusCode === 404) {
                    callback('Invalid project.');
                    return;
                }

                if (response.statusCode !== 200) {
                    callback(response.statusCode + ': Unable to connect to JIRA during getVersions.');
                    return;
                }

                body = JSON.parse(body);
                callback(null, body);
            });
        });
    };

    // ## Create a version ##
    // ### Takes ###
    //
    // *  version: an object of the new version
    // *  callback: for when it's done
    //
    // ### Returns ###
    // 
    // *  error: error text
    // *  version: should be the same version you passed up
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id288232)
    //
    /* {
     *    "description": "An excellent version",
     *    "name": "New Version 1",
     *    "archived": false,
     *    "released": true,
     *    "releaseDate": "2010-07-05",
     *    "userReleaseDate": "5/Jul/2010",
     *    "project": "PXA"
     * }
     */
    this.createVersion = function(version, callback) {
        var self = this;

        this.login(function() {
            var options = {
                uri: url.format({
                    protocol:  self.protocol,
                    host: self.host,
                    port: self.port,
                    pathname: 'rest/api/' + self.apiVersion + '/version'
                }),
                method: 'POST',
                json: true,
                body: version,
                headers: {
                    Cookie: self.cookies.join(';')
                }
            };
            request(options, function(error, response, body) {
                if (response.statusCode === 404) {
                    callback('Version does not exist or the currently authenticated user does not have permission to view it');
                    return;
                }

                if (response.statusCode === 403) {
                    callback('The currently authenticated user does not have permission to edit the version');
                    return;
                }

                if (response.statusCode !== 201) {
                    callback(response.statusCode + ': Unable to connect to JIRA during createVersion.');
                    return;
                }

                callback(null, body);
            });
        });
    };

}).call(JiraApi.prototype);
