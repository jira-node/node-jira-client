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
