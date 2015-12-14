import request from 'request-promise';
import url from 'url';

/**
 * Wrapper for the JIRA Rest Api
 * @constructor
 * @param {object} options - All other parameters to this function are fields on this object.
 * @param {string} [options.protocol=http] - What protocol to use to connect to jira? Ex: http|https
 * @param {string} options.host - What host is this tool connecting to for the jira instance? Ex: jira.somehost.com
 * @param {string} options.port - What port is this tool connecting to jira with? Ex: 8080, 3000, etc
 * @param {string} [options.username] - Specify a username for this tool to authenticate all requests with.
 * @param {string} [options.password] - Specify a password for this tool to authenticate all requests with.
 * @param {string} options.apiVersion - What version of the jira rest api is the instance the tool is connecting to?
 * @param {string} [options.base] - What other url parts exist, if any, before the rest/api/ section?
 * @param {boolean} [options.strictSSL=true] - Does this tool require each request to be authenticated?  Defaults to true.
 * @param {function} [options.request] - What method does this tool use to make its requests?  Defaults to request from request-promise
 */
export default class JiraApi {
  constructor(options) {
    this.protocol = options.protocol || 'http';
    this.host = options.host;
    this.port = options.port;
    this.username = options.username;
    this.password = options.password;
    this.apiVersion = options.apiVersion;
    this.base = options.base || '';
    this.strictSSL = options.strictSSL || true;
      // This is so we can fake during unit tests
    this.request = options.request || request;
  }

  /**
   * Creates a URI object for a given pathName
   * @param {string} pathName - The url after the /rest/api/version
   */
  makeUri(pathName) {
    const uri = url.format({
      protocol: this.protocol,
      hostname: this.host,
      port: this.port,
      pathname: `${this.base}/rest/api/${this.apiVersion}${pathName}`
    });
    return decodeURIComponent(uri);
  }

  /**
   * Does a request based on the requestOptions object
   * @param {object} requestOptions - fields on this object get posted as a request header for requests to jira
   */
  doRequest(requestOptions) {
    if (this.username && this.password) {
      requestOptions.auth = {
        'user': this.username,
        'pass': this.password
      };
    }

    return this.request(requestOptions)
      .then(response => { return JSON.parse(response.body); })
      .then(response => {
        if (Array.isArray(response.errorMessages) && response.errorMessages.length > 0) {
          throw new Error(response.errorMessages.join(', '));
        }

        return response;
      });
  }

  /**
   * Find an issue in jira
   * @param {string} issueNumber - The issue number to search for including the project key
   */
  // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290709)
  findIssue(issueNumber) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/issue/${issueNumber}`),
      method: 'GET'
    };

    return this.doRequest(requestOptions);
  }

  /**
   * Get the unresolved issue count
   * @param {string} version - the version of your product you want to find the unresolved issues of.
   */
  // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id288524)
  getUnresolvedIssueCount(version) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/version/${version}/unresolvedIssueCount`),
      method: 'GET'
    };

    return this.doRequest(requestOptions)
      .then(response => response.issuesUnresolvedCount);
  }

  /**
   * Get the Project by project key
   * @param {string} project - key for the project
   */
  // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289232)

  getProject(project) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/project/${project}`),
      method: 'GET'
    };

    return this.doRequest(requestOptions);
  }

  /** Find the Rapid View for a specified project
   *  @param {string} projectName - name for the project
   */
  findRapidView(projectName) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri('/rapidviews/list'),
      method: 'GET',
      json: true
    };

    return this.doRequest(requestOptions)
      .then(response => {
        const rapidViewResult = response.views.filter(x => x.name.toLowerCase() === projectName.toLowerCase());
        return rapidViewResult[0];
      });
  }

  /** Get a list of Sprints belonging to a Rapid View
   *  @param {string} rapidViewId - the id for the rapid view
   */
  getLastSprintForRapidView(rapidViewId) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/sprintquery/${rapidViewId}`),
      method: 'GET',
      json:true
    };

    return this.doRequest(requestOptions)
      .then(response => {
        return response.sprints.pop();
      });
  }

  /** Get the issues for a rapidView / sprint
   *  @param {string} rapidViewId - the id for the rapid view
   *  @param {string} sprintId - the id for the sprint
   */
  getSprintIssues(rapidViewId, sprintId) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/rapid/charts/sprintreport`),
      method: 'GET',
      json: true,
      qs: {
        rapidViewId,
        sprintId
      }
    };
    return this.doRequest(requestOptions);
  }

  /** Add an issue to the project's current sprint
   *  @param {string} issueId - the id of the existing issue
   *  @param {string} sprintId - the id of the sprint to add it to
   */
  addIssueToSprint(issueId, sprintId) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/sprint/${sprintId}/issues/add`),
      method: 'PUT',
      followAllRedirects: true,
      json:true,
      body: {
        issueKeys: [issueId]
      }
    };

    return this.doRequest(requestOptions);
  }

  /** Create an issue link between two issues
   *  @param {object} link - a link object formatted how the Jira API specifies
   */
  issueLink(link) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri('/issueLink'),
      method: 'POST',
      followAllRedirects: true,
      json: true,
      body: link
    };

    return this.doRequest(requestOptions);
  }

  /** Retrieves the remote links associated with the given issue.
   *  @param {string} issueNumber - the issue number to find remote links for.
   */
  getRemoteLinks(issueNumber) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/issue/${issueNumber}/remotelink`),
      method: 'GET',
      json: true
    };

    return this.doRequest(requestOptions);
  }

  /**
   * Retrieves the remote links associated with the given issue.
   */
  createRemoteLink(issueNumber, remoteLink) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/issue/${issueNumber}/remotelink`),
      method: 'POST',
      json: true,
      body: remoteLink
    };

    return this.doRequest(requestOptions);
  }

  // ## Get Versions for a project ##
  // ### Takes ###
  // *  project: A project key
  // ### Returns ###
  // *  versions: array of the versions for a product
  // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289653)
  getVersions(project) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/project/${project}/versions`),
      method: 'GET'
    };

    return this.doRequest(requestOptions);
  }

  // ## Create a version ##
  // ### Takes ###
  // *  version: an object of the new version
  // ### Returns ###
  // *  version: should be the same version you passed up
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
  createVersion(version) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri('/version'),
      method: 'POST',
      followAllRedirects: true,
      json: true,
      body: version
    };
    return this.doRequest(requestOptions);
  }

  // ## Update a version ##
  // ### Takes ###
  // *  version: an object of the new version
  // ### Returns ###
  // *  version: should be the same version you passed up
  // [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#d2e510)
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
  updateVersion(version) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/version/${version.id}`),
      method: 'PUT',
      followAllRedirects: true,
      json: true,
      body: version
    };

    return this.doRequest(requestOptions);
  }

  // ## Pass a search query to Jira ##
  // ### Takes ###
  // *  searchString: jira query string
  // *  optional: object containing any of the following properties
  //   *  startAt: optional index number (default 0)
  //   *  maxResults: optional max results number (default 50)
  //   *  fields: optional array of desired fields, defaults when null:
  //     *  "summary"
  //     *  "status"
  //     *  "assignee"
  //     *  "description"
  // ### Returns ###
  // *  issues: array of issues for the user
  // [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#d2e4424)
  searchJira(searchString, optional) {
    const theOptional = optional || {};
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri('/search'),
      method: 'POST',
      json: true,
      followAllRedirects: true,
      body: {
        jql: searchString,
        ...theOptional
      }
    };

    return this.doRequest(requestOptions);
  }

  // ## Search user on Jira ##
  // ### Takes ###
  // username: A query string used to search username, name or e-mail address
  // startAt: The index of the first user to return (0-based)
  // maxResults: The maximum number of users to return (defaults to 50).
  // includeActive: If true, then active users are included in the results (default true)
  // includeInactive: If true, then inactive users are included in the results (default false)
  // ### Returns ###
  // *  users: array of users for the user
  // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#d2e3756)
  searchUsers({username, startAt, maxResults, includeActive, includeInactive}) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/user/search?username=${username}&startAt=${startAt || 0}&maxResults=${maxResults || 50}&includeActive=${includeActive || true}&includeInactive=${includeInactive || false}`),
      method: 'GET',
      json: true,
      followAllRedirects: true
    };

    return this.doRequest(requestOptions);
  }

  // ## Get all users in group on Jira ##
  // ### Takes ###
  // groupName: A query string used to search users in group
  // startAt: The index of the first user to return (0-based)
  // maxResults: The maximum number of users to return (defaults to 50).
  // ### Returns ###
  // *  users: array of users for the user
  getUsersInGroup(groupName, startAt, maxResults) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/group?groupname=${groupName}&expand=users[${startAt || 0}:${maxResults || 50}]`),
      method: 'GET',
      json: true,
      followAllRedirects: true
    };

    return this.doRequest(requestOptions);
  }

  // ## Get issues related to a user ##
  // ### Takes ###
  // *  user: username of user to search for
  // *  open: `boolean` determines if only open issues should be returned
  // ### Returns ###
  // *  issues: array of issues for the user
  // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id296043)
  getUsersIssues(username, open) {
    return this.searchJira(`assignee = ${username.replace('@', '\\u0040')} AND status in (Open, 'In Progress', Reopened) ${open}`, {});
  }

  // ## Add issue to Jira ##
  // ### Takes ###
  // *  issue: Properly Formatted Issue
  // ### Returns ###
  // *  Rest API response
  // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290028)
  addNewIssue(issue) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri('/issue'),
      method: 'POST',
      followAllRedirects: true,
      json: true,
      body: issue
    };

    return this.doRequest(requestOptions);
  }

  // ## Add a user as a watcher on an issue ##
  // ### Takes ###
  // *  issueKey: the key of the existing issue
  // *  username: the jira username to add as a watcher to the issue
  // ### Returns ###
  /**
   * Adds a given user as a watcher to the given issue
   */
  addWatcher(issueKey, username) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/issue/${issueKey}/watchers`),
      method: 'POST',
      followAllRedirects: true,
      json: true,
      body: JSON.stringify(username)
    };

    return this.doRequest(requestOptions);
  }

  // ## Delete issue from Jira ##
  // ### Takes ###
  // *  issueId: the Id of the issue to delete
  // ### Returns ###
  // *  success object
  // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290791)
  deleteIssue(issueNum) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/issue/${issueNum}`),
      method: 'DELETE',
      followAllRedirects: true,
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## Update issue in Jira ##
  // ### Takes ###
  // *  issueId: the Id of the issue to delete
  // *  issueUpdate: update Object
  // ### Returns ###
  // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290878)
  updateIssue(issueNum, issueUpdate) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/issue/${issueNum}`),
      body: issueUpdate,
      method: 'PUT',
      followAllRedirects: true,
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## List Components ##
  // ### Takes ###
  // *  project: key for the project
  // ### Returns ###
  // *  array of components
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
  listComponents(project) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/project/${project}/components`),
      method: 'GET',
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## Add component to Jira ##
  // ### Takes ###
  // *  issue: Properly Formatted Component
  // ### Returns ###
  // *  success object
  // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290028)
  addNewComponent(component) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri('/component'),
      method: 'POST',
      followAllRedirects: true,
      json: true,
      body: component
    };

    return this.doRequest(requestOptions);
  }

  // ## Delete component to Jira ##
  // ### Takes ###
  // *  componentId: the Id of the component to delete
  // ### Returns ###
  // *  success object
  // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290791)
  deleteComponent(componentNum) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/component/${componentNum}`),
      method: 'DELETE',
      followAllRedirects: true,
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## List listFields ##
  // ### Returns ###
  // *  array of priorities
  // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
  listFields() {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri('/field'),
      method: 'GET',
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## List listPriorities ##
  // ### Takes ###
  // ### Returns ###
  // *  array of priorities
  // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
  listPriorities() {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri('/priority'),
      method: 'GET',
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## List Transitions ##
  // ### Takes ###
  // *  issueId: get transitions available for the issue
  // ### Returns ###
  // *  error string
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
  listTransitions(issueId) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/issue/${issueId}/transitions?expand=transitions.fields`),
      method: 'GET',
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## Transition issue in Jira ##
  // ### Takes ###
  // *  issueId: the Id of the issue to delete
  // *  issueTransition: transition Object
  // ### Returns ###
  // *  success string
  // [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
  transitionIssue(issueNum, issueTransition) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/issue/${issueNum}/transitions`),
      body: issueTransition,
      method: 'POST',
      followAllRedirects: true,
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## List all Viewable Projects ##
  // ### Takes ###
  // ### Returns ###
  // *  array of projects
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
  listProjects() {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri('/project'),
      method: 'GET',
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## Add a comment to an issue ##
  // ### Takes ###
  // *  issueId: Issue to add a comment to
  // *  comment: string containing comment
  // ### Returns ###
  // *  success string
  // [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#id108798)
  addComment(issueId, comment) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/issue/${issueId}/comment`),
      body: {
        body: comment
      },
      method: 'POST',
      followAllRedirects: true,
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## Add a worklog to a project ##
  // ### Takes ###
  // *  issueId: Issue to add a worklog to
  // *  worklog: worklog object
  // ### Returns ###
  // *  success string
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
  addWorklog(issueId, worklog, newEstimate) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/issue/${issueId}/worklog${(newEstimate) ? '?adjustEstimate=new&newEstimate=' + newEstimate : ''}`),
      body: worklog,
      method: 'POST',
      followAllRedirects: true,
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## Delete worklog from issue ##
  // ### Takes ###
  // *  issueId: the Id of the issue to delete
  // *  worklogId: the Id of the worklog in issue to delete
  // ### Returns ###
  // *  success object
  // [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#d2e1673)
  deleteWorklog(issueId, worklogId) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/issue/${issueId}/worklog/${worklogId}`),
      method: 'DELETE',
      followAllRedirects: true,
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## List all Issue Types ##
  // ### Takes ###
  // ### Returns ###
  // *  array of types
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
  listIssueTypes() {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri('/issuetype'),
      method: 'GET',
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## Register a webhook ##
  // ### Takes ###
  // *  webhook: properly formatted webhook
  // ### Returns ###
  // *  success object
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
  registerWebhook(webhook) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri('/webhook'),
      method: 'POST',
      json: true,
      body: webhook
    };

    return this.doRequest(requestOptions);
  }

  // ## List all registered webhooks ##
  // ### Takes ###
  // ### Returns ###
  // *  array of webhook objects
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
  listWebhooks() {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri('/webhook'),
      method: 'GET',
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## Get a webhook by its ID ##
  // ### Takes ###
  // *  webhookID: id of webhook to get
  // ### Returns ###
  // *  webhook object
  // [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
  getWebhook(webhookID) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/webhook/${webhookID}`),
      method: 'GET',
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## Delete a registered webhook ##
  // ### Takes ###
  // *  webhookID: id of the webhook to delete
  // ### Returns ###
  // *  success string
  // [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
  deleteWebhook(webhookID) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/webhook/${webhookID}`),
      method: 'DELETE',
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## Describe the currently authenticated user ##
  // ### Takes ###
  // ### Returns ###
  // *  user object
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
  getCurrentUser() {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri('/session'),
      method: 'GET',
      json: true
    };

    return this.doRequest(requestOptions);
  }

  // ## Retrieve the backlog of a certain Rapid View ##
  // ### Takes ###
  // *  rapidViewId: rapid view id
  // ### Returns ###
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
  getBacklogForRapidView(rapidViewId) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/xboard/plan/backlog/data?rapidViewId=${rapidViewId}`),
      method: 'GET',
      json: true
    };

    return this.doRequest(requestOptions);
  }
}
