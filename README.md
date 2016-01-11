# JavaScript JIRA API for node.js #

[![Build Status](https://travis-ci.org/jira-node/node-jira-client.png?branch=master)](https://travis-ci.org/node-jira/node-jira-client)

A node.js module, which provides an object oriented wrapper for the JIRA REST API.

This library is built to support version `2.0.alpha1` of the JIRA REST API.
This library is also tested with version `2` of the JIRA REST API.
  It has been noted that with Jira OnDemand, `2.0.alpha1` does not work, devs
  should revert to `2`. If this changes, please notify us.

JIRA REST API documentation can be found [here](http://docs.atlassian.com/jira/REST/latest/)

## Installation ##

  Install with the node package manager [npm](http://npmjs.org):

    $ npm install jira-client

or

  Install via git clone:

    $ git clone git://github.com/node-jira/node-jira-client.git
    $ cd node-jira-client
    $ npm install

## Examples ##

### Create the JIRA client ###

    JiraApi = require('jira-client').JiraApi;
    
    var jira = new JiraApi('https', config.host, config.port, config.user, config.password, '2.0.alpha1');

### Find the status of an issue ###

    jira.findIssue(issueNumber, function(error, issue) {
        console.log('Status: ' + issue.fields.status.name);
    });


Currently there is no explicit login call necessary as each API call uses Basic Authentication to authenticate. 

### Get an issue remote links ###

Returns an array of remote links data.

    jira.getRemoteLinks(issueKey, function(err, links) {
        if (!err) {
            console.log(issueKey + ' has ' + links.length + ' web links');
        }
    });

### Create a remote link on an issue ###

Returns an array of remote links data.
    
    // create a web link to a GitHub issue
    var linkData = {
        "object": {
            "url" : "https://github.com/node-jira/node-jira-client/issues/1",
            "title": "Add getVersions and createVersion functions",
            "icon" : {
                "url16x16": "https://github.com/favicon.ico"
            }
        }
    };
    
    jira.createRemoteLink(issueKey, linkData, function (err, link) {
        
    });

More information can be found by checking [JIRA Developer documentation](https://developer.atlassian.com/display/JIRADEV/JIRA+REST+API+for+Remote+Issue+Links#JIRARESTAPIforRemoteIssueLinks-CreatingLinks).

## Options ##

JiraApi options:
*  `protocol<string>`: Typically 'http:' or 'https:'
*  `host<string>`: The hostname for your jira server
*  `port<int>`: The port your jira server is listening on (probably `80` or `443`)
*  `user<string>`: The username to log in with
*  `password<string>`: Keep it secret, keep it safe
*  `Jira API Version<string>`: Known to work with `2` and `2.0.alpha1`
*  `verbose<bool>`: Log some info to the console, usually for debugging
*  `strictSSL<bool>`: Set to false if you have self-signed certs or something non-trustworthy
*  `oauth`: A dictionary of `consumer_key`, `consumer_secret`, `access_token` and `access_token_secret` to be used for OAuth authentication.
*  `base<string>`: A base slug if your JIRA instance is not at the root of `host`

## Implemented APIs ##

*  Authentication
   *  HTTP
   *  OAuth
*  Projects
  *  Pulling a project
  *  List all projects viewable to the user
  *  List Components
  *  List Fields
  *  List Priorities
*  Versions
  *  Pulling versions
  *  Adding a new version
  *  Pulling unresolved issues count for a specific version
*  Rapid Views
  *  Find based on project name
  *  Get the latest Green Hopper sprint
  *  Gets attached issues
*  Issues
  *  Add a new issue
  *  Update an issue
  *  Add watcher to an issue
  *  Transition an issue
  *  Pulling an issue
  *  Issue linking
  *  Add an issue to a sprint
  *  Get a users issues (open or all)
  *  List issue types
  *  Search using jql
    *  Set Max Results
    *  Set Start-At parameter for results
  *  Add a worklog
  *  Delete a worklog
  *  Add new estimate for worklog
  *  Add a comment
  *  Remote links (aka Web Links)
    * Create a remote link on an issue
    * Get all remote links of an issue
*  Transitions
  *  List
*  Users
  *  Search

## TODO ##

*  Refactor currently implemented APIs to be more Object Oriented
*  Refactor to make use of built-in node.js events and classes
