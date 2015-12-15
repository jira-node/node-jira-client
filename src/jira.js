import request from 'request-promise';
import url from 'url';

/**
 * @name JiraApi
 * @class
 * Wrapper for the JIRA Rest Api
 * https://docs.atlassian.com/jira/REST/6.4.8/
 */
export default class JiraApi {
  /*
   * @constructor
   * @function
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
   * @name makeUri
   * @function
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
   * @name doRequest
   * @function
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
   * @name findIssue
   * @function
   * Find an issue in jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290709)
   * @param {string} issueNumber - The issue number to search for including the project key
   */
  findIssue(issueNumber) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/issue/${issueNumber}`),
      method: 'GET'
    };

    return this.doRequest(requestOptions);
  }

  /**
   * @name getUnresolvedIssueCount
   * @function
   * Get the unresolved issue count
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id288524)
   * @param {string} version - the version of your product you want to find the unresolved issues of.
   */
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
   * @name getProject
   * @function
   * Get the Project by project key
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289232)
   * @param {string} project - key for the project
   */
  getProject(project) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/project/${project}`),
      method: 'GET'
    };

    return this.doRequest(requestOptions);
  }

  /** Find the Rapid View for a specified project
   * @name findRapidView
   * @function
   * @param {string} projectName - name for the project
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
   * @name getLastSprintForRapidView
   * @function
   * @param {string} rapidViewId - the id for the rapid view
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
   * @name getSprintIssues
   * @function
   * @param {string} rapidViewId - the id for the rapid view
   * @param {string} sprintId - the id for the sprint
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
   * @name addIssueToSprint
   * @function
   * @param {string} issueId - the id of the existing issue
   * @param {string} sprintId - the id of the sprint to add it to
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
   * @name issueLink
   * @function
   * @param {object} link - a link object formatted how the Jira API specifies
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
   * @name getRemoteLinks
   * @function
   * @param {string} issueNumber - the issue number to find remote links for.
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
   * @name createRemoteLink
   * @function
   * Creates a remote link associated with the given issue.
   * @param {string} issueNumber - The issue number to create the remotelink under
   * @param {object} remoteLink - the remotelink object as specified by the Jira API
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

  /** Get Versions for a project
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289653)
   * @name getVersions
   * @function
   * @param {string} project - A project key to get versions for
   */
  getVersions(project) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/project/${project}/versions`),
      method: 'GET'
    };

    return this.doRequest(requestOptions);
  }

  /** Create a version
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id288232)
   * @name createVersion
   * @function
   * @param {string} version - an object of the new version
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

  /** Update a version
   * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#d2e510)
   * @name updateVersion
   * @function
   * @param {string} version - an new object of the version to update
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

  /** Search user on Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#d2e3756)
   * @name searchUsers
   * @function
   * @param {string} username - A query string used to search username, name or e-mail address
   * @param {integer} [startAt=0] - The index of the first user to return (0-based)
   * @param {integer} [maxResults=50] - The maximum number of users to return
   * @param {boolean} [includeActive=true] - If true, then active users are included in the results
   * @param {boolean} [includeInactive=false] - If true, then inactive users are included in the results
   */
  searchUsers({username, startAt, maxResults, includeActive, includeInactive}) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/user/search`),
      method: 'GET',
      json: true,
      followAllRedirects: true,
      qs: {
        username,
        startAt: startAt || 0,
        maxResults: maxResults || 50,
        includeActive: includeActive || true,
        includeInactive: includeInactive || false
      }
    };

    return this.doRequest(requestOptions);
  }

  /** Get all users in group on Jira
   * @name getUsersInGroup
   * @function
   * @param {string} groupName - A query string used to search users in group
   * @param {integer} [startAt=0] - The index of the first user to return (0-based)
   * @param {integer} [maxResults=50] - The maximum number of users to return (defaults to 50).
   */
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

  /** Get issues related to a user
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id296043)
   * @name getUsersIssues
   * @function
   * @param {string} user - username of user to search for
   * @param {boolean} open - determines if only open issues should be returned
   */
  getUsersIssues(username, open) {
    return this.searchJira(`assignee = ${username.replace('@', '\\u0040')} AND status in (Open, 'In Progress', Reopened) ${open}`, {});
  }

  /** Add issue to Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290028)
   * @name addNewIssue
   * @function
   * @param {object} issue - Properly Formatted Issue object
   */
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

  /** Add a user as a watcher on an issue
   * @name addWatcher
   * @function
   * @param {string} issueKey - the key of the existing issue
   * @param {string} username - the jira username to add as a watcher to the issue
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

  /** Delete issue from Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290791)
   * @name deleteIssue
   * @function
   * @param {string} issueId - the Id of the issue to delete
   */
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

  /** Update issue in Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290878)
   * @name updateIssue
   * @function
   * @param {string} issueId - the Id of the issue to delete
   * @param {object} issueUpdate - update Object as specified by the rest api
   */
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

  /** List Components
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
   * @name listComponents
   * @function
   * @param {string} project - key for the project
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

  /** Add component to Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290028)
   * @name addNewComponent
   * @function
   * @param {object} component - Properly Formatted Component
   */
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

  /** Delete component from Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290791)
   * @name deleteComponent
   * @function
   * @param {string} componentId - the Id of the component to delete
   */
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

  /** List all fields custom and not that jira knows about.
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
   * @name listFields
   * @function
   */
  listFields() {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri('/field'),
      method: 'GET',
      json: true
    };

    return this.doRequest(requestOptions);
  }

  /** List all priorities jira knows about
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
   * @name listPriorities
   * @function
   */
  listPriorities() {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri('/priority'),
      method: 'GET',
      json: true
    };

    return this.doRequest(requestOptions);
  }

  /** List Transitions for a specific issue that are available to the current user
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
   * @name listTransitions
   * @function
   * @param {string} issueId - get transitions available for the issue
   */
  listTransitions(issueId) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/issue/${issueId}/transitions`),
      method: 'GET',
      json: true,
      qs: {
        expand: 'transitions.fields'
      }
    };

    return this.doRequest(requestOptions);
  }

  /** Transition issue in Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
   * @name transitionsIssue
   * @function
   * @param {string} issueId - the Id of the issue to delete
   * @param {object} issueTransition - transition object from the jira rest API
   */
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

  /** List all Viewable Projects
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289193)
   * @name listProjects
   * @function
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

  /** Add a comment to an issue
   * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#id108798)
   * @name addComment
   * @function
   * @param {string} issueId - Issue to add a comment to
   * @param {string} comment - string containing comment
   */
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

  /** Add a worklog to a project
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id291617)
   * @name addWorklog
   * @function
   * @param {string} issueId - Issue to add a worklog to
   * @param {object} worklog - worklog object from the rest API
   */
  addWorklog(issueId, worklog, newEstimate) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/issue/${issueId}/worklog`),
      body: worklog,
      method: 'POST',
      followAllRedirects: true,
      json: true,
      qs: (newEstimate) ? {adjustEstimate: 'new', newEstimate} : null
    };

    return this.doRequest(requestOptions);
  }

  /** Delete worklog from issue
   * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#d2e1673)
   * @name deleteWorklog
   * @function
   * @param {string} issueId - the Id of the issue to delete
   * @param {string} worklogId - the Id of the worklog in issue to delete
   */
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

  /** List all Issue Types jira knows about
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id295946)
   * @name listIssueTypes
   * @function
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

  /** Register a webhook
   * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
   * @name registerWebhook
   * @function
   * @param {object} webhook - properly formatted webhook
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

  /** List all registered webhooks
   * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
   * @name listWebhooks
   * @function
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

  /** Get a webhook by its ID
   * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
   * @name getWebhook
   * @function
   * @param {string} webhookID - id of webhook to get
   */
  getWebhook(webhookID) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/webhook/${webhookID}`),
      method: 'GET',
      json: true
    };

    return this.doRequest(requestOptions);
  }

  /** Delete a registered webhook
   * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
   * @name issueLink
   * @function
   * @param {string} webhookID - id of the webhook to delete
   */
  deleteWebhook(webhookID) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/webhook/${webhookID}`),
      method: 'DELETE',
      json: true
    };

    return this.doRequest(requestOptions);
  }

  /** Describe the currently authenticated user
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id2e865)
   * @name getCurrentUser
   * @function
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

  /** Retrieve the backlog of a certain Rapid View
   * @name getBacklogForRapidView
   * @function
   * @param {string} rapidViewId: rapid view id
   */
  getBacklogForRapidView(rapidViewId) {
    const requestOptions = {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(`/xboard/plan/backlog/data`),
      method: 'GET',
      json: true,
      qs: {
        rapidViewId
      }
    };

    return this.doRequest(requestOptions);
  }
}
