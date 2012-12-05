# JavaScript JIRA API for node.js #

A node.js module, which provides an object oriented wrapper for the JIRA REST API.

This library is built to support version `2.0.alpha1` of the JIRA REST API.
This library is also tested with version `2` of the JIRA REST API

JIRA REST API documentation can be found [here](http://docs.atlassian.com/jira/REST/latest/)

## Installation ##

  Install with the node package manager [npm](http://npmjs.org):

    $ npm install jira

or

  Install via git clone:

    $ git clone git://git://github.com/steves/node-jira.git
    $ cd node-jira
    $ npm install

## Example ##

Find the status of an issue.

    JiraApi = require('jira').JiraApi;

    var jira = new JiraApi('https', config.host, config.port, config.user, config.password, '2.0.alpha1');
    jira.findIssue(issueNumber, function(error, issue) {
        console.log('Status: ' + issue.fields.status.value.name);
    });

Currently there is no explicit login call necessary as each API call makes a call to `login` before processing. This causes a lot of unnecessary logins and will be cleaned up in a future version.

## Implemented APIs ##

*  Authentication
*  Projects
  *  Pulling a project
  *  List all projects viewable to the user
*  Versions
  *  Pulling versions
  *  Adding a new version
  *  Pulling unresolved issues count for a specific version
*  Find a Rapid View based on project name
*  Get the latest Green Hopper sprint for a Rapid View
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
  *  Add a worklog
*  Transitions
  *  List

## TODO ##

*  Tests
*  Refactor currently implemented APIs to be more Object Oriented
*  Refactor to make use of built-in node.js events and classes
*  Auto-redirect between `http` and `https` following headers

## Changelog ##

*  _0.0.5 JQL search now takes a list of fields_
*  _0.0.4 Added jql search_
*  _0.0.3 Added APIs and Docco documentation_
*  _0.0.2 Initial version_
