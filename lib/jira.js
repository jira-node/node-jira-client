// # JavaScript JIRA API for node.js #
//
// [![Build Status](https://travis-ci.org/steves/node-jira.png?branch=master)](https://travis-ci.org/steves/node-jira)
//
// A node.js module, which provides an object oriented wrapper for the JIRA REST API.
//
// This library is built to support version `2.0.alpha1` of the JIRA REST API.
// This library is also tested with version `2` of the JIRA REST API
//   It has been noted that with Jira OnDemand, `2.0.alpha1` does not work, devs
//   should revert to `2`. If this changes, please notify us.
//
// JIRA REST API documentation can be found [here](http://docs.atlassian.com/jira/REST/latest/)
//
// ## Installation ##
//
//   Install with the node package manager [npm](http://npmjs.org):
//
//     $ npm install jira
//
// or
//
//   Install via git clone:
//
//     $ git clone git://github.com/steves/node-jira.git
//     $ cd node-jira
//     $ npm install
//
// ## Example ##
//
// Find the status of an issue.
//
//     JiraApi = require('jira').JiraApi;
//
//     var jira = new JiraApi('https', config.host, config.port, config.user, config.password, '2.0.alpha1');
//     jira.findIssue(issueNumber, function(error, issue) {
//         console.log('Status: ' + issue.fields.status.name);
//     });
//
// Currently there is no explicit login call necessary as each API call uses Basic Authentication to authenticate.
//
// ## Options ##
//
// JiraApi options:
// *  `protocol<string>`: Typically 'http:' or 'https:'
// *  `host<string>`: The hostname for your jira server
// *  `port<int>`: The port your jira server is listening on (probably `80` or `443`)
// *  `user<string>`: The username to log in with
// *  `password<string>`: Keep it secret, keep it safe
// *  `Jira API Version<string>`: Known to work with `2` and `2.0.alpha1`
// *  `verbose<bool>`: Log some info to the console, usually for debugging
// *  `strictSSL<bool>`: Set to false if you have self-signed certs or something non-trustworthy
// * `oauth`: A dictionary of `consumer_key`, `consumer_secret`, `access_token` and `access_token_secret` to be used for OAuth authentication.
//
// ## Implemented APIs ##
//
// *  Authentication
//   *  HTTP
//   *  OAuth
// *  Projects
//   *  Pulling a project
//   *  List all projects viewable to the user
//   *  List Components
//   *  List Fields
//   *  List Priorities
// *  Versions
//   *  Pulling versions
//   *  Adding a new version
//   *  Pulling unresolved issues count for a specific version
// *  Rapid Views
//   *  Find based on project name
//   *  Get the latest Green Hopper sprint
//   *  Gets attached issues
// *  Issues
//   *  Add a new issue
//   *  Update an issue
//   *  Transition an issue
//   *  Pulling an issue
//   *  Issue linking
//   *  Add an issue to a sprint
//   *  Get a users issues (open or all)
//   *  List issue types
//   *  Search using jql
//     *  Set Max Results
//     *  Set Start-At parameter for results
//   *  Add a worklog
//   *  Add new estimate for worklog
//   *  Add a comment
// *  Transitions
//   *  List
// *  Users
//   *  Search
//
// ## TODO ##
//
// *  Refactor currently implemented APIs to be more Object Oriented
// *  Refactor to make use of built-in node.js events and classes
//
// ## Changelog ##
//
//
// *  _0.9.0 Add OAuth Support and New Estimates on addWorklog (thanks to
//    [nagyv](https://github.com/nagyv))_
// *  _0.8.2 Fix URL Format Issues (thanks to
//         [eduardolundgren](https://github.com/eduardolundgren))_
// *  _0.8.1 Expanding the transitions options (thanks to
//         [eduardolundgren](https://github.com/eduardolundgren))_
// *  _0.8.0 Ability to search users (thanks to
//         [eduardolundgren](https://github.com/eduardolundgren))_
// *  _0.7.2 Allows HTTP Code 204 on issue update edit (thanks to
//         [eduardolundgren](https://github.com/eduardolundgren))_
// *  _0.7.1 Check if body variable is undef (thanks to
//         [AlexCline](https://github.com/AlexCline))_
// *  _0.7.0 Adds list priorities, list fields, and project components (thanks to
//         [eduardolundgren](https://github.com/eduardolundgren))_
// *  _0.6.0 Comment API implemented (thanks to [StevenMcD](https://github.com/StevenMcD))_
// *  _0.5.0 Last param is now for strict SSL checking, defaults to true_
// *  _0.4.1 Now handing errors in the request callback (thanks [mrbrookman](https://github.com/mrbrookman))_
// *  _0.4.0 Now auto-redirecting between http and https (for both GET and POST)_
// *  _0.3.1 [Request](https://github.com/mikeal/request) is broken, setting max request package at 2.15.0_
// *  _0.3.0 Now Gets Issues for a Rapidview/Sprint (thanks [donbonifacio](https://github.com/donbonifacio))_
// *  _0.2.0 Now allowing startAt and MaxResults to be passed to searchJira,
//    switching to semantic versioning._
// *  _0.1.0 Using Basic Auth instead of cookies, all calls unit tested, URI
//    creation refactored_
// *  _0.0.6 Now linting, preparing to refactor_
// *  _0.0.5 JQL search now takes a list of fields_
// *  _0.0.4 Added jql search_
// *  _0.0.3 Added APIs and Docco documentation_
// *  _0.0.2 Initial version_
var url = require('url'),
    logger = console,
    OAuth = require("oauth");


var JiraApi = exports.JiraApi = function(protocol, host, port, username, password, apiVersion, verbose, strictSSL, oauth) {
    this.protocol = protocol;
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
    this.apiVersion = apiVersion;
    // Default strictSSL to true (previous behavior) but now allow it to be
    // modified
    if (strictSSL == null) {
        strictSSL = true;
    }
    this.strictSSL = strictSSL;
    // This is so we can fake during unit tests
    this.request = require('request');
    if (verbose !== true) { logger = { log: function() {} }; }

    // This is the same almost every time, refactored to make changing it
    // later, easier
    this.makeUri = function(pathname, altBase, altApiVersion) {
        var basePath = 'rest/api/';
        if (altBase != null) {
            basePath = altBase;
        }

        var apiVersion = this.apiVersion;
        if (altApiVersion != null) {
          apiVersion = altApiVersion;
        }

        var uri = url.format({
            protocol: this.protocol,
            hostname: this.host,
            port: this.port,
            pathname: basePath + apiVersion + pathname
        });
        return decodeURIComponent(uri);
    };

    this.doRequest = function(options, callback) {
        if(oauth && oauth.consumer_key && oauth.consumer_secret) {
          options.oauth = {
            consumer_key: oauth.consumer_key,
            consumer_secret: oauth.consumer_secret,
            token: oauth.access_token,
            token_secret: oauth.access_token_secret
          };
        } else {
          options.auth = {
            'user': this.username,
            'pass': this.password
          };
        }
        this.request(options, callback);
    };

};

(function() {
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

        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/issue/' + issueNumber),
            method: 'GET'
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 404) {
                callback('Invalid issue number.');
                return;
            }

            if (response.statusCode !== 200) {
                callback(response.statusCode + ': Unable to connect to JIRA during findIssueStatus.');
                return;
            }

            if (body === undefined) {
                callback('Response body was undefined.');
                return;
            }

            callback(null, JSON.parse(body));

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
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/version/' + version + '/unresolvedIssueCount'),
            method: 'GET'
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

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

        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/project/' + project),
            method: 'GET'
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

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

        var options = {
          rejectUnauthorized: this.strictSSL,
          uri: this.makeUri('/rapidviews/list', 'rest/greenhopper/'),
          method: 'GET',
          json: true
        };

        this.doRequest(options, function(error, response) {

          if (error) {
              callback(error, null);
              return;
          }

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
     * @param rapidViewId
     * @param callback
     */
    this.getLastSprintForRapidView = function(rapidViewId, callback) {

        var options = {
          rejectUnauthorized: this.strictSSL,
          uri: this.makeUri('/sprintquery/' + rapidViewId, 'rest/greenhopper/'),
          method: 'GET',
          json:true
        };

        this.doRequest(options, function(error, response) {

          if (error) {
              callback(error, null);
              return;
          }

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
    };

    // ## Get the issues for a rapidView / sprint##
    // ### Takes ###
    //
    // *  rapidViewId: the id for the rapid view
    // *  sprintId: the id for the sprint
    // *  callback: for when it's done
    //
    // ### Returns ###
    //
    // *  error: string with the error
    // *  results: the object with the issues and additional sprint information
    /**
     * Returns sprint and issues information
     *
     * @param rapidViewId
     * @param sprintId
     * @param callback
     */
    this.getSprintIssues = function getSprintIssues(rapidViewId, sprintId, callback) {

      var options = {
        rejectUnauthorized: this.strictSSL,
        uri: this.makeUri('/rapid/charts/sprintreport?rapidViewId=' + rapidViewId + '&sprintId=' + sprintId, 'rest/greenhopper/'),
        method: 'GET',
        json: true
      };

      this.doRequest(options, function(error, response) {

        if (error) {
            callback(error, null);
            return;
        }

        if( response.statusCode === 404 ) {
          callback('Invalid URL');
          return;
        }

        if( response.statusCode !== 200 ) {
          callback(response.statusCode + ': Unable to connect to JIRA during sprints search');
          return;
        }

        if(response.body !== null) {
          callback(null, response.body);
        } else {
          callback('No body');
        }

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

        var options = {
          rejectUnauthorized: this.strictSSL,
          uri: this.makeUri('/sprint/' + sprintId + '/issues/add', 'rest/greenhopper/'),
          method: 'PUT',
          followAllRedirects: true,
          json:true,
          body: {
            issueKeys: [issueId]
          }
        };

        logger.log(options.uri);

        this.doRequest(options, function(error, response) {

          if (error) {
              callback(error, null);
              return;
          }

          if (response.statusCode === 404) {
            callback('Invalid URL');
            return;
          }

          if (response.statusCode !== 204) {
            callback(response.statusCode + ': Unable to connect to JIRA to add to sprint.');
            return;
          }

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
     * @param callback
     */
    this.issueLink = function(link, callback) {

        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/issueLink'),
            method: 'POST',
            followAllRedirects: true,
            json: true,
            body: link
        };

        this.doRequest(options, function(error, response) {

            if (error) {
                callback(error, null);
                return;
            }

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

        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/project/' + project + '/versions'),
            method: 'GET'
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

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

        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/version'),
            method: 'POST',
            followAllRedirects: true,
            json: true,
            body: version
        };
        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

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
    };

    // ## Update a version ##
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
    // [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#d2e510)
    //
    /* {
     *    "id": The ID of the version being updated. Required.
     *    "description": "An excellent version",
     *    "name": "New Version 1",
     *    "archived": false,
     *    "released": true,
     *    "releaseDate": "2010-07-05",
     *    "userReleaseDate": "5/Jul/2010",
     *    "project": "PXA"
     * }
     */
    this.updateVersion = function(version, callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/version/'+version.id),
            method: 'PUT',
            followAllRedirects: true,
            json: true,
            body: version
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 404) {
                callback('Version does not exist or the currently authenticated user does not have permission to view it');
                return;
            }

            if (response.statusCode === 403) {
                callback('The currently authenticated user does not have permission to edit the version');
                return;
            }

            if (response.statusCode !== 200) {
                callback(response.statusCode + ': Unable to connect to JIRA during updateVersion.');
                return;
            }

            callback(null, body);

        });
    };

    // ## Pass a search query to Jira ##
    // ### Takes ###
    //
    // *  searchString: jira query string
    // *  optional: object containing any of the following properties
    //   *  startAt: optional index number (default 0)
    //   *  maxResults: optional max results number (default 50)
    //   *  fields: optional array of desired fields, defaults when null:
    //     *  "summary"
    //     *  "status"
    //     *  "assignee"
    //     *  "description"
    // *  callback: for when it's done
    //
    // ### Returns ###
    //
    // *  error: string if there's an error
    // *  issues: array of issues for the user
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id333082)
    this.searchJira = function(searchString, optional, callback) {
        // backwards compatibility
        optional = optional || {};
        if (Array.isArray(optional)) {
            optional = { fields: optional };
        }

        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/search'),
            method: 'POST',
            json: true,
            followAllRedirects: true,
            body: {
                jql: searchString,
                startAt: optional.startAt || 0,
                maxResults: optional.maxResults || 50,
                fields: optional.fields || ["summary", "status", "assignee", "description"]
            }
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 400) {
                callback('Problem with the JQL query');
                return;
            }

            if (response.statusCode !== 200) {
                callback(response.statusCode + ': Unable to connect to JIRA during search.');
                return;
            }

            callback(null, body);

        });
    };

    // ## Search user on Jira ##
    // ### Takes ###
    //
    // username: A query string used to search username, name or e-mail address
    // startAt: The index of the first user to return (0-based)
    // maxResults: The maximum number of users to return (defaults to 50).
    // includeActive: If true, then active users are included in the results (default true)
    // includeInactive: If true, then inactive users are included in the results (default false)
    // *  callback: for when it's done
    //
    // ### Returns ###
    //
    // *  error: string if there's an error
    // *  users: array of users for the user
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#d2e3756)
    //
    this.searchUsers = function(username, startAt, maxResults, includeActive, includeInactive, callback) {
        startAt = (startAt !== undefined) ? startAt : 0;
        maxResults = (maxResults !== undefined) ? maxResults : 50;
        includeActive = (includeActive !== undefined) ? includeActive : true;
        includeInactive = (includeInactive !== undefined) ? includeInactive : false;

        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri(
                '/user/search?username=' + username +
                '&startAt=' + startAt +
                '&maxResults=' + maxResults +
                '&includeActive=' + includeActive +
                '&includeInactive=' + includeInactive),
            method: 'GET',
            json: true,
            followAllRedirects: true
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 400) {
                callback('Unable to search');
                return;
            }

            if (response.statusCode !== 200) {
                callback(response.statusCode + ': Unable to connect to JIRA during search.');
                return;
            }

            callback(null, body);

        });
    };

    // ## Get issues related to a user ##
    // ### Takes ###
    //
    // *  user: username of user to search for
    // *  open: `boolean` determines if only open issues should be returned
    // *  callback: for when it's done
    //
    // ### Returns ###
    //
    // *  error: string if there's an error
    // *  issues: array of issues for the user
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id296043)
    //
    this.getUsersIssues = function(username, open, callback) {
        if (username.indexOf("@") > -1) {
            username = username.replace("@", '\\u0040');
        }
        var jql = "assignee = " + username;
        var openText = ' AND status in (Open, "In Progress", Reopened)';
        if (open) { jql += openText; }
        this.searchJira(jql, {}, callback);
    };

    // ## Add issue to Jira ##
    // ### Takes ###
    //
    // *  issue: Properly Formatted Issue
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error object (check out the Jira Doc)
    // *  success object
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290028)
    this.addNewIssue = function(issue, callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/issue'),
            method: 'POST',
            followAllRedirects: true,
            json: true,
            body: issue
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 400) {
                callback(body);
                return;
            }

            if ((response.statusCode !== 200) && (response.statusCode !== 201)) {
                callback(response.statusCode + ': Unable to connect to JIRA during search.');
                return;
            }

            callback(null, body);

        });
    };

    // ## Delete issue to Jira ##
    // ### Takes ###
    //
    // *  issueId: the Id of the issue to delete
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  success object
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290791)
    this.deleteIssue = function(issueNum, callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/issue/' + issueNum),
            method: 'DELETE',
            followAllRedirects: true,
            json: true
        };

        this.doRequest(options, function(error, response) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 204) {
                callback(null, "Success");
                return;
            }

            callback(response.statusCode + ': Error while deleting');

        });
    };

    // ## Update issue in Jira ##
    // ### Takes ###
    //
    // *  issueId: the Id of the issue to delete
    // *  issueUpdate: update Object
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  success string
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290878)
    this.updateIssue = function(issueNum, issueUpdate, callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/issue/' + issueNum),
            body: issueUpdate,
            method: 'PUT',
            followAllRedirects: true,
            json: true
        };

        this.doRequest(options, function(error, response) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 200 || response.statusCode === 204) {
                callback(null, "Success");
                return;
            }

            callback(response.statusCode + ': Error while updating');

        });
    };

    // ## List Components ##
    // ### Takes ###
    //
    // *  project: key for the project
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  array of components
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
    /*
     * [{
     *     "self": "http://localhostname:8090/jira/rest/api/2.0/component/1234",
     *     "id": "1234",
     *     "name": "name",
     *     "description": "Description.",
     *     "assigneeType": "PROJECT_DEFAULT",
     *     "assignee": {
     *         "self": "http://localhostname:8090/jira/rest/api/2.0/user?username=user@domain.com",
     *         "name": "user@domain.com",
     *         "displayName": "SE Support",
     *         "active": true
     *     },
     *     "realAssigneeType": "PROJECT_DEFAULT",
     *     "realAssignee": {
     *         "self": "http://localhostname:8090/jira/rest/api/2.0/user?username=user@domain.com",
     *         "name": "user@domain.com",
     *         "displayName": "User name",
     *         "active": true
     *     },
     *     "isAssigneeTypeValid": true
     * }]
     */
    this.listComponents = function(project, callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/project/' + project + '/components'),
            method: 'GET',
            json: true
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 200) {
                callback(null, body);
                return;
            }
            if (response.statusCode === 404) {
                callback("Project not found");
                return;
            }

            callback(response.statusCode + ': Error while updating');

        });
    };

    // ## List listFields ##
    // ### Takes ###
    //
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  array of priorities
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
    /*
     * [{
     *    "id": "field",
     *    "name": "Field",
     *    "custom": false,
     *    "orderable": true,
     *    "navigable": true,
     *    "searchable": true,
     *    "schema": {
     *        "type": "string",
     *        "system": "field"
     *    }
     * }]
     */
    this.listFields = function(callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/field'),
            method: 'GET',
            json: true
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 200) {
                callback(null, body);
                return;
            }
            if (response.statusCode === 404) {
                callback("Not found");
                return;
            }

            callback(response.statusCode + ': Error while updating');

        });
    };

    // ## List listPriorities ##
    // ### Takes ###
    //
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  array of priorities
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
    /*
     * [{
     *    "self": "http://localhostname:8090/jira/rest/api/2.0/priority/1",
     *    "statusColor": "#ff3300",
     *    "description": "Crashes, loss of data, severe memory leak.",
     *    "name": "Major",
     *    "id": "2"
     * }]
     */
    this.listPriorities = function(callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/priority'),
            method: 'GET',
            json: true
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 200) {
                callback(null, body);
                return;
            }
            if (response.statusCode === 404) {
                callback("Not found");
                return;
            }

            callback(response.statusCode + ': Error while updating');

        });
    };

    // ## List Transitions ##
    // ### Takes ###
    //
    // *  issueId: get transitions available for the issue
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  array of transitions
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
    /*
     *  {
     *  "expand": "transitions",
     *  "transitions": [
     *      {
     *          "id": "2",
     *          "name": "Close Issue",
     *          "to": {
     *              "self": "http://localhostname:8090/jira/rest/api/2.0/status/10000",
     *              "description": "The issue is currently being worked on.",
     *              "iconUrl": "http://localhostname:8090/jira/images/icons/progress.gif",
     *              "name": "In Progress",
     *              "id": "10000"
     *          },
     *          "fields": {
     *              "summary": {
     *                  "required": false,
     *                  "schema": {
     *                      "type": "array",
     *                      "items": "option",
     *                      "custom": "com.atlassian.jira.plugin.system.customfieldtypes:multiselect",
     *                      "customId": 10001
     *                  },
     *                  "name": "My Multi Select",
     *                  "operations": [
     *                      "set",
     *                      "add"
     *                  ],
     *                  "allowedValues": [
     *                      "red",
     *                      "blue"
     *                  ]
     *              }
     *          }
     *      }
     *  ]}
     */
    this.listTransitions = function(issueId, callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/issue/' + issueId + '/transitions?expand=transitions.fields'),
            method: 'GET',
            json: true
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 200) {
                callback(null, body);
                return;
            }
            if (response.statusCode === 404) {
                callback("Issue not found");
                return;
            }

            callback(response.statusCode + ': Error while updating');

        });
    };

    // ## Transition issue in Jira ##
    // ### Takes ###
    //
    // *  issueId: the Id of the issue to delete
    // *  issueTransition: transition Object
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  success string
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
    this.transitionIssue = function(issueNum, issueTransition, callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/issue/' + issueNum + '/transitions'),
            body: issueTransition,
            method: 'POST',
            followAllRedirects: true,
            json: true
        };

        this.doRequest(options, function(error, response) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 204) {
                callback(null, "Success");
                return;
            }

            callback(response.statusCode + ': Error while updating');

        });
    };

    // ## List all Viewable Projects ##
    // ### Takes ###
    //
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  array of projects
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289193)
    /*
     * Result items are in the format:
     * {
     *      "self": "http://www.example.com/jira/rest/api/2/project/ABC",
     *      "id": "10001",
     *      "key": "ABC",
     *      "name": "Alphabetical",
     *      "avatarUrls": {
     *          "16x16": "http://www.example.com/jira/secure/projectavatar?size=small&pid=10001",
     *          "48x48": "http://www.example.com/jira/secure/projectavatar?size=large&pid=10001"
     *      }
     * }
     */
    this.listProjects = function(callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/project'),
            method: 'GET',
            json: true
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 200) {
                callback(null, body);
                return;
            }
            if (response.statusCode === 500) {
                callback(response.statusCode + ': Error while retrieving list.');
                return;
            }

            callback(response.statusCode + ': Error while updating');

        });
    };

    // ## Add a comment to an issue ##
    // ### Takes ###
    // *  issueId: Issue to add a comment to
    // *  comment: string containing comment
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  success string
    //
    // [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#id108798)
    this.addComment = function(issueId, comment, callback){
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/issue/' + issueId + '/comment'),
            body: {
              "body": comment
            },
            method: 'POST',
            followAllRedirects: true,
            json: true
        };

        this.doRequest(options, function(error, response, body) {
            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 201) {
                callback(null, "Success");
                return;
            }

            if (response.statusCode === 400) {
                callback("Invalid Fields: " + JSON.stringify(body));
                return;
            };
            
            callback(response.statusCode + ': Error while adding comment');
        });
    };

    // ## Add a worklog to a project ##
    // ### Takes ###
    // *  issueId: Issue to add a worklog to
    // *  worklog: worklog object
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  success string
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id291617)
    /*
     * Worklog item is in the format:
     *  {
     *      "self": "http://www.example.com/jira/rest/api/2.0/issue/10010/worklog/10000",
     *      "author": {
     *          "self": "http://www.example.com/jira/rest/api/2.0/user?username=fred",
     *          "name": "fred",
     *          "displayName": "Fred F. User",
     *          "active": false
     *      },
     *      "updateAuthor": {
     *          "self": "http://www.example.com/jira/rest/api/2.0/user?username=fred",
     *          "name": "fred",
     *          "displayName": "Fred F. User",
     *          "active": false
     *      },
     *      "comment": "I did some work here.",
     *      "visibility": {
     *          "type": "group",
     *          "value": "jira-developers"
     *      },
     *      "started": "2012-11-22T04:19:46.736-0600",
     *      "timeSpent": "3h 20m",
     *      "timeSpentSeconds": 12000,
     *      "id": "100028"
     *  }
     */
    this.addWorklog = function(issueId, worklog, newEstimate, callback) {
        if(typeof callback == 'undefined') {
            callback = newEstimate;
            newEstimate = false;
        }
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/issue/' + issueId + '/worklog' + (newEstimate ? "?adjustEstimate=new&newEstimate=" + newEstimate : "")),
            body: worklog,
            method: 'POST',
            followAllRedirects: true,
            json: true
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 201) {
                callback(null, "Success");
                return;
            }
            if (response.statusCode === 400) {
                callback("Invalid Fields: " + JSON.stringify(body));
                return;
            }
            if (response.statusCode === 403) {
                callback("Insufficient Permissions");
                return;
            }

            callback(response.statusCode + ': Error while updating');

        });
    };

    // ## List all Issue Types ##
    // ### Takes ###
    //
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  array of types
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id295946)
    /*
     * Result items are in the format:
     * {
     *  "self": "http://localhostname:8090/jira/rest/api/2.0/issueType/3",
     *  "id": "3",
     *  "description": "A task that needs to be done.",
     *  "iconUrl": "http://localhostname:8090/jira/images/icons/task.gif",
     *  "name": "Task",
     *  "subtask": false
     * }
     */
    this.listIssueTypes = function(callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/issuetype'),
            method: 'GET',
            json: true
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 200) {
                callback(null, body);
                return;
            }

            callback(response.statusCode + ': Error while retrieving issue types');

        });
    };

    // ## Register a webhook ##
    // ### Takes ###
    //
    // *  webhook: properly formatted webhook
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  success object
    //
    // [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
    /*
     * Success object in the format:
     * {
     *   name: 'my first webhook via rest',
     *   events: [],
     *   url: 'http://www.example.com/webhooks',
     *   filter: '',
     *   excludeIssueDetails: false,
     *   enabled: true,
     *   self: 'http://localhost:8090/rest/webhooks/1.0/webhook/5',
     *   lastUpdatedUser: 'user',
     *   lastUpdatedDisplayName: 'User Name',
     *   lastUpdated: 1383247225784
     * }
     */
    this.registerWebhook = function(webhook, callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/webhook', 'rest/webhooks/', '1.0'),
            method: 'POST',
            json: true,
            body: webhook
        };

        this.request(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 201) {
                callback(null, body);
                return;
            }

            callback(response.statusCode + ': Error while registering new webhook');

        });
    };

    // ## List all registered webhooks ##
    // ### Takes ###
    //
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  array of webhook objects
    //
    // [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
    /*
     * Webhook object in the format:
     * {
     *   name: 'my first webhook via rest',
     *   events: [],
     *   url: 'http://www.example.com/webhooks',
     *   filter: '',
     *   excludeIssueDetails: false,
     *   enabled: true,
     *   self: 'http://localhost:8090/rest/webhooks/1.0/webhook/5',
     *   lastUpdatedUser: 'user',
     *   lastUpdatedDisplayName: 'User Name',
     *   lastUpdated: 1383247225784
     * }
     */
    this.listWebhooks = function(callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/webhook', 'rest/webhooks/', '1.0'),
            method: 'GET',
            json: true
        };

        this.request(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 200) {
                callback(null, body);
                return;
            }

            callback(response.statusCode + ': Error while listing webhooks');

        });
    };

    // ## Get a webhook by its ID ##
    // ### Takes ###
    //
    // *  webhookID: id of webhook to get
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  webhook object
    //
    // [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
    this.getWebhook = function(webhookID, callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/webhook/' + webhookID, 'rest/webhooks/', '1.0'),
            method: 'GET',
            json: true
        };

        this.request(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 200) {
                callback(null, body);
                return;
            }

            callback(response.statusCode + ': Error while getting webhook');

        });
    };

    // ## Delete a registered webhook ##
    // ### Takes ###
    //
    // *  webhookID: id of the webhook to delete
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  success string
    //
    // [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
    this.deleteWebhook = function(webhookID, callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/webhook/' + webhookID, 'rest/webhooks/', '1.0'),
            method: 'DELETE',
            json: true
        };

        this.request(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 204) {
                callback(null, "Success");
                return;
            }

            callback(response.statusCode + ': Error while deleting webhook');

        });
    };

    // ## Describe the currently authenticated user ##
    // ### Takes ###
    //
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  user object
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id2e865)
    /*
     * User object in the format:
     * {
     *   self: 'http://localhost:8090/rest/api/latest/user?username=user',
     *   name: 'user',
     *   loginInfo:
     *   {
     *     failedLoginCount: 2,
     *     loginCount: 114,
     *     lastFailedLoginTime: '2013-10-29T13:33:26.702+0000',
     *     previousLoginTime: '2013-10-31T20:30:51.924+0000'
     *   }
     * }
     */
    this.getCurrentUser = function(callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/session', 'rest/auth/', '1'),
            method: 'GET',
            json: true
        };

        this.doRequest(options, function(error, response, body) {

            if (error) {
                callback(error, null);
                return;
            }

            if (response.statusCode === 200) {
                callback(null, body);
                return;
            }

            callback(response.statusCode + ': Error while getting current user');

        });
    };

    // ## Retrieve the backlog of a certain Rapid View ##
    // ### Takes ###
    // *  rapidViewId: rapid view id
    // *  callback: for when it's done
    //
    // ### Returns ###
    // *  error string
    // *  backlog object
    /*
     * Backlog item is in the format:
     *  {
     *      "sprintMarkersMigrated": true,
     *      "issues": [
     *          {
     *              "id": 67890,
     *              "key": "KEY-1234",
     *              "summary": "Issue Summary",
     *              ...
     *          }
     *      ],
     *      "rankCustomFieldId": 12345,
     *      "sprints": [
     *          {
     *              "id": 123,
     *              "name": "Sprint Name",
     *              "state": "FUTURE",
     *              ...
     *          }
     *      ],
     *      "supportsPages": true,
     *      "projects": [
     *          {
     *              "id": 567,
     *              "key": "KEY",
     *              "name": "Project Name"
     *          }
     *      ],
     *      "epicData": {
     *          "epics": [
     *              {
     *                  "id": 9876,
     *                  "key": "KEY-4554",
     *                  "typeName": "Epic",
     *                  ...
     *              }
     *          ],
     *          "canEditEpics": true,
     *          "supportsPages": true
     *      },
     *      "canManageSprints": true,
     *      "maxIssuesExceeded": false,
     *      "queryResultLimit": 2147483647,
     *      "versionData": {
     *          "versionsPerProject": {
     *              "567": [
     *                  {
     *                      "id": 8282,
     *                      "name": "Version Name",
     *                      ...
     *                  }
     *              ]
     *          },
     *          "canCreateVersion": true
     *      }
     *  }
     */
    this.getBacklogForRapidView = function(rapidViewId, callback) {
        var options = {
            rejectUnauthorized: this.strictSSL,
            uri: this.makeUri('/xboard/plan/backlog/data?rapidViewId=' + rapidViewId, 'rest/greenhopper/'),
            method: 'GET',
            json: true
        };

        this.doRequest(options, function(error, response) {
            if (error) {
                callback(error, null);

                return;
            }

            if (response.statusCode === 200) {
                callback(null, response.body);

                return;
            }

            callback(response.statusCode + ': Error while retrieving backlog');
        });
    };

}).call(JiraApi.prototype);
