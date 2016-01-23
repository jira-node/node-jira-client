# JavaScript JIRA API for node.js #

A node.js module, which provides an object oriented wrapper for the Jira Rest API.

[![Documentation](https://img.shields.io/badge/Documentation--green.svg)](https://jira-node.github.io/)
[![Jira Rest API](https://img.shields.io/badge/Jira%20Rest%20API--green.svg)](http://docs.atlassian.com/jira/REST/latest/)
[![Build Status](https://img.shields.io/travis/jira-node/node-jira-client/master.svg)](https://travis-ci.org/jira-node/node-jira-client)

## Installation ##

Install with the node package manager [npm](http://npmjs.org):

```shell
$ npm install jira-client
```

## Examples ##

### Create the JIRA client ###

```javascript
// With ES5
var JiraApi = require('jira-client');

// With ES6
import JiraApi from 'jira-client';

// Initialize
var jira = new JiraApi({
  protocol: 'https',
  host: 'jira.somehost.com',
  username: 'username',
  password: 'password',
  apiVersion: '2',
  strictSSL: true
});
```

### Find the status of an issue ###

```javascript
// ES5
// We are using an ES5 Polyfill for Promise support. Please note that if you don't explicitly
// apply a catch exceptions will get swallowed. Read up on ES6 Promises for further details.
jira.findIssue(issueNumber)
  .then(function(issue) {
    console.log('Status: ' + issue.fields.status.name);
  })
  .catch(function(err) {
    console.error(err);
  });

// ES6
jira.findIssue(issueNumber)
  .then(issue => {
    console.log(`Status: ${issue.fields.status.name}`);
  })
  .catch(err => {
    console.error(err);
  });

// ES7
async function logIssueName() {
  try {
    const issue = await jira.findIssue(issueNumber);
    console.log(`Status: ${issue.fields.status.name}`);
  } catch (err) {
    console.error(err);
  }
}

```
