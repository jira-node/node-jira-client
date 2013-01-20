// # JavaScript JIRA API for node.js #
// 
// A node.js module, which provides an object oriented wrapper for the JIRA REST API.
// 
// This library is built to support version `2.0.alpha1` of the JIRA REST API.
// This library is also tested with version `2` of the JIRA REST API
//  It has been noted that with Jira OnDemand, `2.0.alpha1` does not work, devs
//  should revert to `2`. If this changes, please notify us.
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
//     $ git clone git://git://github.com/steves/node-jira.git
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
//         console.log('Status: ' + issue.fields.status.value.name);
//     });
// 
// Currently there is no explicit login call necessary as each API call makes a call to `login` before processing. This causes a lot of unnecessary logins and will be cleaned up in a future version.
// 
// ## Implemented APIs ##
// 
// *  Authentication
// *  Projects
//   *  Pulling a project
//   *  List all projects viewable to the user
// *  Versions
//   *  Pulling versions
//   *  Adding a new version
//   *  Pulling unresolved issues count for a specific version
// *  Find a Rapid View based on project name
// *  Get the latest Green Hopper sprint for a Rapid View
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
//   *  Add a worklog
// *  Transitions
//   *  List
// 
// ## TODO ##
// 
// *  Tests
// *  Refactor currently implemented APIs to be more Object Oriented
// *  Refactor to make use of built-in node.js events and classes
// *  Auto-redirect between `http` and `https` following headers
// 
// ## Changelog ##
// 
// *  _0.0.4 JQL search now takes a list of fields_
// *  _0.0.4 Added jql search_
// *  _0.0.3 Added APIs and Docco documentation_
// *  _0.0.2 Initial version_
//
//
var url = require('url'),
    logger = console;


var JiraApi = exports.JiraApi = function(protocol, host, port, username, password, apiVersion, verbose) {
    this.protocol = protocol;
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
    this.apiVersion = apiVersion;
    this.request = require('request');
    if (verbose !== true) { logger = { log: function() {} }; }
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
            uri: url.format({
                protocol: this.protocol,
                hostname: this.host,
                auth: this.username + ':' + this.password,
                port: this.port,
                pathname: 'rest/api/' + this.apiVersion + '/issue/' + issueNumber
            }),
            method: 'GET'
        };

        this.request(options, function(error, response, body) {
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
            uri: url.format({
                protocol: this.protocol,
                hostname: this.host,
                auth: this.username + ':' + this.password,
                port: this.port,
                pathname: 'rest/api/' + this.apiVersion + '/version/' + version + '/unresolvedIssueCount'
            }),
            method: 'GET'
        };

        this.request(options, function(error, response, body) {
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
            uri: url.format({
                protocol: this.protocol,
                hostname: this.host,
                auth: this.username + ':' + this.password,
                port: this.port,
                pathname: 'rest/api/' + this.apiVersion + '/project/' + project
            }),
            method: 'GET'
        };

        this.request(options, function(error, response, body) {
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
          uri: url.format({
            protocol: this.protocol,
            hostname: this.host,
            auth: this.username + ':' + this.password,
            port: this.port,
            pathname: 'rest/greenhopper/' + this.apiVersion + '/rapidviews/list'
          }),
          method: 'GET',
          json: true
        };

        this.request(options, function(error, response) {
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
     * @param rapidView ID
     * @param callback
     */
    this.getLastSprintForRapidView = function(rapidViewId, callback) {

        var options = {
          uri: url.format({
            protocol: this.protocol,
            hostname: this.host,
            auth: this.username + ':' + this.password,
            port: this.port,
            pathname: 'rest/greenhopper/' + this.apiVersion + '/sprints/' + rapidViewId
          }),
          method: 'GET',
          json:true
        };

        this.request(options, function(error, response) {
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
          uri: url.format({
            protocol: this.protocol,
            hostname: this.host,
            auth: this.username + ':' + this.password,
            port: this.port,
            pathname: 'rest/greenhopper/' + this.apiVersion + '/sprint/' + sprintId + '/issues/add'
          }),
          method: 'PUT',
          json:true,
          body: {
            issueKeys: [issueId]
          }
        };

        logger.log(options.uri);
        this.request(options, function(error, response) {
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
     * @param errorCallback
     * @param successCallback
     */
    this.issueLink = function(link, callback) {

        var options = {
            uri: url.format({
                protocol: this.protocol,
                hostname: this.host,
                auth: this.username + ':' + this.password,
                port: this.port,
                pathname: 'rest/api/' + this.apiVersion + '/issueLink'
            }),
            method: 'POST',
            json: true,
            body: link
        };

        this.request(options, function(error, response) {
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
            uri: url.format({
                protocol: this.protocol,
                hostname: this.host,
                auth: this.username + ':' + this.password,
                port: this.port,
                pathname: 'rest/api/' + this.apiVersion + '/project/' + project + '/versions'
            }),
            method: 'GET'
        };

        this.request(options, function(error, response, body) {
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
            uri: url.format({
                protocol:  this.protocol,
                hostname: this.host,
                auth: this.username + ':' + this.password,
                port: this.port,
                pathname: 'rest/api/' + this.apiVersion + '/version'
            }),
            method: 'POST',
            json: true,
            body: version
        };
        this.request(options, function(error, response, body) {
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
    
    // ## Pass a search query to Jira ##
    // ### Takes ###
    //
    // *  searchString: jira query string
    // *  fields: optional array of desired fields, defaults when null: 
    //   *  "summary"
    //   *  "status"
    //   *  "assignee"
    //   *  "description" 
    // *  callback: for when it's done
    //
    // ### Returns ###
    // 
    // *  error: string if there's an error
    // *  issues: array of issues for the user
    //
    // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id296043)
    //
    this.searchJira = function(searchString, fields, callback) {

        
        if (fields == null) {
            fields = ["summary", "status", "assignee", "description"];
        }
        var options = {
            uri: url.format({
                protocol:  this.protocol,
                auth: this.username + ':' + this.password,
                hostname: this.host,
                port: this.port,
                pathname: 'rest/api/' + this.apiVersion + '/search'
            }),
            method: 'POST',
            json: true,
            body: {
                jql:searchString,
                startAt: 0,
                fields: fields 
            }
        };
        this.request(options, function(error, response, body) {
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
        var jql = "assignee = " + username;
        var openText = ' AND status in (Open, "In Progress", Reopened)';
        if (open) { jql += openText; }
        this.searchJira(jql, null, callback);
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
            uri: url.format({
                protocol:  this.protocol,
                hostname: this.host,
                auth: this.username + ':' + this.password,
                port: this.port,
                pathname: 'rest/api/' + this.apiVersion + '/issue'
            }),
            method: 'POST',
            json: true,
            body: issue
        };

        this.request(options, function(error, response, body) {
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
            uri: url.format({
                protocol:  this.protocol,
                hostname: this.host,
                auth: this.username + ':' + this.password,
                port: this.port,
                pathname: 'rest/api/' + this.apiVersion + '/issue/' + issueNum
            }),
            method: 'DELETE',
            json: true
        };

        this.request(options, function(error, response) {
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
            uri: url.format({
                protocol:  this.protocol,
                hostname: this.host,
                auth: this.username + ':' + this.password,
                port: this.port,
                pathname: 'rest/api/' + this.apiVersion + '/issue/' + issueNum
            }),
            body: issueUpdate,
            method: 'PUT',
            json: true
        };

        this.request(options, function(error, response) {
            if (response.statusCode === 200) {
                callback(null, "Success");
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
            uri: url.format({
                protocol:  this.protocol,
                hostname: this.host,
                auth: this.username + ':' + this.password,
                port: this.port,
                pathname: 'rest/api/' + this.apiVersion + '/issue/' + issueId + '/transitions'
            }),
            method: 'GET',
            json: true
        };

        this.request(options, function(error, response, body) {
            if (response.statusCode === 200) {
                callback(null, body.transitions);
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
            uri: url.format({
                protocol:  this.protocol,
                hostname: this.host,
                auth: this.username + ':' + this.password,
                port: this.port,
                pathname: 'rest/api/' + this.apiVersion + '/issue/' + issueNum + '/transitions'
            }),
            body: issueTransition,
            method: 'POST',
            json: true
        };

        this.request(options, function(error, response) {
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
            uri: url.format({
                protocol:  this.protocol,
                hostname: this.host,
                auth: this.username + ':' + this.password,
                port: this.port,
                pathname: 'rest/api/' + this.apiVersion + '/project'
            }),
            method: 'GET',
            json: true
        };

        this.request(options, function(error, response, body) {
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
    this.addWorklog = function(issueId, worklog, callback) {
        var options = {
            uri: url.format({
                protocol:  this.protocol,
                hostname: this.host,
                auth: this.username + ':' + this.password,
                port: this.port,
                pathname: 'rest/api/' + this.apiVersion + '/issue/' + issueId + '/worklog'
            }),
            body: worklog,
            method: 'POST',
            json: true
        };

        this.request(options, function(error, response, body) {
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
            uri: url.format({
                protocol:  this.protocol,
                hostname: this.host,
                auth: this.username + ':' + this.password,
                port: this.port,
                pathname: 'rest/api/' + this.apiVersion + '/issuetype'
            }),
            method: 'GET',
            json: true
        };

        this.request(options, function(error, response, body) {
            if (response.statusCode === 200) {
                callback(null, body);
                return;
            }
            callback(response.statusCode + ': Error while retreiving issue types');
        });
    };

}).call(JiraApi.prototype);
