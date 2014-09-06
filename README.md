# JavaScript JIRA API for node.js #

[![Build Status](https://travis-ci.org/steves/node-jira.png?branch=master)](https://travis-ci.org/steves/node-jira)

A node.js module, which provides an object oriented wrapper for the JIRA REST API.

This library is built to support version `2.0.alpha1` of the JIRA REST API.
This library is also tested with version `2` of the JIRA REST API.
  It has been noted that with Jira OnDemand, `2.0.alpha1` does not work, devs
  should revert to `2`. If this changes, please notify us.

JIRA REST API documentation can be found [here](http://docs.atlassian.com/jira/REST/latest/)

## Installation ##

  Install with the node package manager [npm](http://npmjs.org):

    $ npm install jira

or

  Install via git clone:

    $ git clone git://github.com/steves/node-jira.git
    $ cd node-jira
    $ npm install

## Example ##

Find the status of an issue.

    JiraApi = require('jira').JiraApi;

    var jira = new JiraApi('https', config.host, config.port, config.user, config.password, '2.0.alpha1');
    jira.findIssue(issueNumber, function(error, issue) {
        console.log('Status: ' + issue.fields.status.name);
    });

Currently there is no explicit login call necessary as each API call uses Basic Authentication to authenticate. 

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
  *  Add new estimate for worklog
  *  Add a comment
*  Transitions
  *  List
*  Users
  *  Search

## TODO ##

*  Refactor currently implemented APIs to be more Object Oriented
*  Refactor to make use of built-in node.js events and classes

## Changelog ##


* _0.9.2 Smaller fixes and features added_
  * proper doRequest usage (thanks to [ndamnjanovic](https://github.com/ndamnjanovic))
  * Support for @ in usernames (thanks to [ryanplasma](https://github.com/ryanplasma))
  * Handling empty responses in getIssue
*  _0.9.0 Add OAuth Support and New Estimates on addWorklog (thanks to [nagyv](https://github.com/nagyv))_
*  _0.8.2 Fix URL Format Issues (thanks to
        [eduardolundgren](https://github.com/eduardolundgren))_
*  _0.8.1 Expanding the transitions options (thanks to
        [eduardolundgren](https://github.com/eduardolundgren))_
*  _0.8.0 Ability to search users (thanks to
        [eduardolundgren](https://github.com/eduardolundgren))_
*  _0.7.2 Allows HTTP Code 204 on issue update edit (thanks to
        [eduardolundgren](https://github.com/eduardolundgren))_
*  _0.7.1 Check if body variable is undef (thanks to
        [AlexCline](https://github.com/AlexCline))_
*  _0.7.0 Adds list priorities, list fields, and project components (thanks to
        [eduardolundgren](https://github.com/eduardolundgren))_
*  _0.6.0 Comment API implemented (thanks to [StevenMcD](https://github.com/StevenMcD))_
*  _0.5.0 Last param is now for strict SSL checking, defaults to true_
*  _0.4.1 Now handing errors in the request callback (thanks [mrbrookman](https://github.com/mrbrookman))_
*  _0.4.0 Now auto-redirecting between http and https (for both GET and POST)_
*  _0.3.1 [Request](https://github.com/mikeal/request) is broken, setting max request package at 2.15.0_
*  _0.3.0 Now Gets Issues for a Rapidview/Sprint (thanks [donbonifacio](https://github.com/donbonifacio))_
*  _0.2.0 Now allowing startAt and MaxResults to be passed to searchJira,
   switching to semantic versioning._
*  _0.1.0 Using Basic Auth instead of cookies, all calls unit tested, URI
   creation refactored_
*  _0.0.6 Now linting, preparing to refactor_
*  _0.0.5 JQL search now takes a list of fields_
*  _0.0.4 Added jql search_
*  _0.0.3 Added APIs and Docco documentation_
*  _0.0.2 Initial version_
