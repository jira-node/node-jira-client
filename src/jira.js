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
   * @param {JiraApiOptions} options
   */
  constructor(options) {
    this.protocol = options.protocol || 'http';
    this.host = options.host;
    this.port = options.port || 80;
    this.apiVersion = options.apiVersion || '2';
    this.base = options.base || '';
    this.strictSSL = options.strictSSL || true;
      // This is so we can fake during unit tests
    this.request = options.request || request;
    this.baseOptions = {};

    if (options.username && options.password) {
      this.baseOptions.auth = {
        user: options.username,
        pass: options.password
      };
    }

    if (options.timeout) {
      this.baseOptions.timeout = options.timeout;
    }
  }

  /**
   * @typedef JiraApiOptions
   * @type {object}
   * @property {string} [protocol=http] - What protocol to use to connect to
   * jira? Ex: http|https
   * @property {string} host - What host is this tool connecting to for the jira
   * instance? Ex: jira.somehost.com
   * @property {string} [port=80] - What port is this tool connecting to jira with?
   * Ex: 8080, 3000, etc
   * @property {string} [username] - Specify a username for this tool to authenticate all
   * requests with.
   * @property {string} [password] - Specify a password for this tool to authenticate all
   * requests with.
   * @property {string} [apiVersion=2] - What version of the jira rest api is the instance the
   * tool is connecting to?
   * @property {string} [base] - What other url parts exist, if any, before the rest/api/
   * section?
   * @property {boolean} [strictSSL=true] - Does this tool require each request to be
   * authenticated?  Defaults to true.
   * @property {function} [request] - What method does this tool use to make its requests?
   * Defaults to request from request-promise
   * @property {number} [timeout] - Integer containing the number of milliseconds to wait for a
   * server to send response headers (and start the response body) before aborting the request. Note
   * that if the underlying TCP connection cannot be established, the OS-wide TCP connection timeout
   * will overrule the timeout option ([the default in Linux can be anywhere from 20-120 *
   * seconds](http://www.sekuda.com/overriding_the_default_linux_kernel_20_second_tcp_socket_connect_timeout)).
   */

  /**
   * @name makeRequestHeader
   * @function
   * Creates a requestOptions object based on the default template for one
   * @param {string} uri
   * @param {object} otherOptions - an object containing fields and formatting how the
   */
  makeRequestHeader(uri, otherOptions = {}) {
    return {
      rejectUnauthorized: this.strictSSL,
      uri: this.makeUri(uri),
      method: otherOptions.method || 'GET',
      json: true,
      ...otherOptions
    };
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
   * @param {object} requestOptions - fields on this object get posted as a request header for
   * requests to jira
   */
  async doRequest(requestOptions) {
    const options = {
      ...this.baseOptions,
      ...requestOptions
    };

    const response = await this.request(options);
    if (response) {
      if (Array.isArray(response.errorMessages) && response.errorMessages.length > 0) {
        throw new Error(response.errorMessages.join(', '));
      }
    }

    return response;
  }

  /**
   * @name findIssue
   * @function
   * Find an issue in jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290709)
   * @param {string} issueNumber - The issue number to search for including the project key
   */
  findIssue(issueNumber) {
    return this.doRequest(this.makeRequestHeader(`/issue/${issueNumber}`));
  }

  /**
   * @name getUnresolvedIssueCount
   * @function
   * Get the unresolved issue count
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id288524)
   * @param {string} version - the version of your product you want to find the unresolved
   * issues of.
   */
  async getUnresolvedIssueCount(version) {
    const requestHeaders = this.makeRequestHeader(`/version/${version}/unresolvedIssueCount`);
    const response = await this.doRequest(requestHeaders);
    return response.issuesUnresolvedCount;
  }

  /**
   * @name getProject
   * @function
   * Get the Project by project key
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289232)
   * @param {string} project - key for the project
   */
  getProject(project) {
    return this.doRequest(this.makeRequestHeader(`/project/${project}`));
  }

  /** Find the Rapid View for a specified project
   * @name findRapidView
   * @function
   * @param {string} projectName - name for the project
   */
  async findRapidView(projectName) {
    const response = await this.doRequest(this.makeRequestHeader('/rapidviews/list'));

    const rapidViewResult = response.views
      .filter(x => x.name.toLowerCase() === projectName.toLowerCase());

    return rapidViewResult[0];
  }

  /** Get a list of Sprints belonging to a Rapid View
   * @name getLastSprintForRapidView
   * @function
   * @param {string} rapidViewId - the id for the rapid view
   */
  async getLastSprintForRapidView(rapidViewId) {
    const response = await this.doRequest(this.makeRequestHeader(`/sprintquery/${rapidViewId}`));
    return response.sprints.pop();
  }

  /** Get the issues for a rapidView / sprint
   * @name getSprintIssues
   * @function
   * @param {string} rapidViewId - the id for the rapid view
   * @param {string} sprintId - the id for the sprint
   */
  getSprintIssues(rapidViewId, sprintId) {
    return this.doRequest(this.makeRequestHeader(`/rapid/charts/sprintreport`, {
      qs: {
        rapidViewId,
        sprintId
      }
    }));
  }

  /** Add an issue to the project's current sprint
   * @name addIssueToSprint
   * @function
   * @param {string} issueId - the id of the existing issue
   * @param {string} sprintId - the id of the sprint to add it to
   */
  addIssueToSprint(issueId, sprintId) {
    return this.doRequest(this.makeRequestHeader(`/sprint/${sprintId}/issues/add`, {
      method: 'PUT',
      followAllRedirects: true,
      body: {
        issueKeys: [issueId]
      }
    }));
  }

  /** Create an issue link between two issues
   * @name issueLink
   * @function
   * @param {object} link - a link object formatted how the Jira API specifies
   */
  issueLink(link) {
    return this.doRequest(this.makeRequestHeader(`/issueLink`, {
      method: 'POST',
      followAllRedirects: true,
      body: link
    }));
  }

  /** Retrieves the remote links associated with the given issue.
   * @name getRemoteLinks
   * @function
   * @param {string} issueNumber - the issue number to find remote links for.
   */
  getRemoteLinks(issueNumber) {
    return this.doRequest(this.makeRequestHeader(`/issue/${issueNumber}/remotelink`));
  }

  /**
   * @name createRemoteLink
   * @function
   * Creates a remote link associated with the given issue.
   * @param {string} issueNumber - The issue number to create the remotelink under
   * @param {object} remoteLink - the remotelink object as specified by the Jira API
   */
  createRemoteLink(issueNumber, remoteLink) {
    return this.doRequest(this.makeRequestHeader(`/issue/${issueNumber}/remotelink`, {
      method: 'POST',
      body: remoteLink
    }));
  }

  /** Get Versions for a project
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289653)
   * @name getVersions
   * @function
   * @param {string} project - A project key to get versions for
   */
  getVersions(project) {
    return this.doRequest(this.makeRequestHeader(`/project/${project}/versions`));
  }

  /** Create a version
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id288232)
   * @name createVersion
   * @function
   * @param {string} version - an object of the new version
   */
  createVersion(version) {
    return this.doRequest(this.makeRequestHeader(`/version`, {
      method: 'POST',
      followAllRedirects: true,
      body: version
    }));
  }

  /** Update a version
   * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#d2e510)
   * @name updateVersion
   * @function
   * @param {string} version - an new object of the version to update
   */
  updateVersion(version) {
    return this.doRequest(this.makeRequestHeader(`/version/${version.id}`, {
      method: 'PUT',
      followAllRedirects: true,
      body: version
    }));
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
  searchJira(searchString, optional = {}) {
    return this.doRequest(this.makeRequestHeader(`/search`, {
      method: 'POST',
      followAllRedirects: true,
      body: {
        jql: searchString,
        ...optional
      }
    }));
  }

  /** Search user on Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#d2e3756)
   * @name searchUsers
   * @function
   * @param {SearchUserOptions} options
   */
  searchUsers({ username, startAt, maxResults, includeActive, includeInactive }) {
    return this.doRequest(this.makeRequestHeader(`/user/search`, {
      followAllRedirects: true,
      qs: {
        username,
        startAt: startAt || 0,
        maxResults: maxResults || 50,
        includeActive: includeActive || true,
        includeInactive: includeInactive || false
      }
    }));
  }

  /**
   * @typedef SearchUserOptions
   * @type {object}
   * @property {string} username - A query string used to search username, name or e-mail address
   * @property {integer} [startAt=0] - The index of the first user to return (0-based)
   * @property {integer} [maxResults=50] - The maximum number of users to return
   * @property {boolean} [includeActive=true] - If true, then active users are included
   * in the results
   * @property {boolean} [includeInactive=false] - If true, then inactive users
   * are included in the results
   */

  /** Get all users in group on Jira
   * @name getUsersInGroup
   * @function
   * @param {string} groupName - A query string used to search users in group
   * @param {integer} [startAt=0] - The index of the first user to return (0-based)
   * @param {integer} [maxResults=50] - The maximum number of users to return (defaults to 50).
   */
  getUsersInGroup(groupName, startAt = 0, maxResults = 50) {
    return this.doRequest(
      this.makeRequestHeader(
        `/group?groupname=${groupName}&expand=users[${startAt}:${maxResults}]`, {
          followAllRedirects: true
        }));
  }

  /** Get issues related to a user
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id296043)
   * @name getUsersIssues
   * @function
   * @param {string} username - username of user to search for
   * @param {boolean} open - determines if only open issues should be returned
   */
  getUsersIssues(username, open) {
    return this.searchJira(
      `assignee = ${username.replace('@', '\\u0040')} ` +
      `AND status in (Open, 'In Progress', Reopened) ${open}`, {});
  }

  /** Add issue to Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290028)
   * @name addNewIssue
   * @function
   * @param {object} issue - Properly Formatted Issue object
   */
  addNewIssue(issue) {
    return this.doRequest(this.makeRequestHeader(`/issue`, {
      method: 'POST',
      followAllRedirects: true,
      body: issue
    }));
  }

  /** Add a user as a watcher on an issue
   * @name addWatcher
   * @function
   * @param {string} issueKey - the key of the existing issue
   * @param {string} username - the jira username to add as a watcher to the issue
   */
  addWatcher(issueKey, username) {
    return this.doRequest(this.makeRequestHeader(`/issue/${issueKey}/watchers`, {
      method: 'POST',
      followAllRedirects: true,
      body: JSON.stringify(username)
    }));
  }

  /** Delete issue from Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290791)
   * @name deleteIssue
   * @function
   * @param {string} issueId - the Id of the issue to delete
   */
  deleteIssue(issueId) {
    return this.doRequest(this.makeRequestHeader(`/issue/${issueId}`, {
      method: 'DELETE',
      followAllRedirects: true
    }));
  }

  /** Update issue in Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290878)
   * @name updateIssue
   * @function
   * @param {string} issueId - the Id of the issue to delete
   * @param {object} issueUpdate - update Object as specified by the rest api
   */
  updateIssue(issueId, issueUpdate) {
    return this.doRequest(this.makeRequestHeader(`/issue/${issueId}`, {
      body: issueUpdate,
      method: 'PUT',
      followAllRedirects: true
    }));
  }

  /** List Components
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
   * @name listComponents
   * @function
   * @param {string} project - key for the project
   */
  listComponents(project) {
    return this.doRequest(this.makeRequestHeader(`/project/${project}/components`));
  }

  /** Add component to Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290028)
   * @name addNewComponent
   * @function
   * @param {object} component - Properly Formatted Component
   */
  addNewComponent(component) {
    return this.doRequest(this.makeRequestHeader(`/component`, {
      method: 'POST',
      followAllRedirects: true,
      body: component
    }));
  }

  /** Delete component from Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290791)
   * @name deleteComponent
   * @function
   * @param {string} componentId - the Id of the component to delete
   */
  deleteComponent(componentId) {
    return this.doRequest(this.makeRequestHeader(`/component/${componentId}`, {
      method: 'DELETE',
      followAllRedirects: true
    }));
  }

  /** List all fields custom and not that jira knows about.
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
   * @name listFields
   * @function
   */
  listFields() {
    return this.doRequest(this.makeRequestHeader(`/field`));
  }

  /** List all priorities jira knows about
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
   * @name listPriorities
   * @function
   */
  listPriorities() {
    return this.doRequest(this.makeRequestHeader(`/priority`));
  }

  /** List Transitions for a specific issue that are available to the current user
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
   * @name listTransitions
   * @function
   * @param {string} issueId - get transitions available for the issue
   */
  listTransitions(issueId) {
    return this.doRequest(this.makeRequestHeader(`/issue/${issueId}/transitions`, {
      qs: {
        expand: 'transitions.fields'
      }
    }));
  }

  /** Transition issue in Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
   * @name transitionsIssue
   * @function
   * @param {string} issueId - the Id of the issue to delete
   * @param {object} issueTransition - transition object from the jira rest API
   */
  transitionIssue(issueId, issueTransition) {
    return this.doRequest(this.makeRequestHeader(`/issue/${issueId}/transitions`, {
      body: issueTransition,
      method: 'POST',
      followAllRedirects: true
    }));
  }

  /** List all Viewable Projects
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289193)
   * @name listProjects
   * @function
   */
  listProjects() {
    return this.doRequest(this.makeRequestHeader(`/project`));
  }

  /** Add a comment to an issue
   * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#id108798)
   * @name addComment
   * @function
   * @param {string} issueId - Issue to add a comment to
   * @param {string} comment - string containing comment
   */
  addComment(issueId, comment) {
    return this.doRequest(this.makeRequestHeader(`/issue/${issueId}/comment`, {
      body: {
        body: comment
      },
      method: 'POST',
      followAllRedirects: true
    }));
  }

  /** Add a worklog to a project
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id291617)
   * @name addWorklog
   * @function
   * @param {string} issueId - Issue to add a worklog to
   * @param {object} worklog - worklog object from the rest API
   * @param {object} newEstimate - the new value for the remaining estimate field
   */
  addWorklog(issueId, worklog, newEstimate) {
    return this.doRequest(this.makeRequestHeader(`/issue/${issueId}/worklog`, {
      body: worklog,
      method: 'POST',
      followAllRedirects: true,
      qs: (newEstimate) ? { adjustEstimate: 'new', newEstimate } : null
    }));
  }

  /** Delete worklog from issue
   * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#d2e1673)
   * @name deleteWorklog
   * @function
   * @param {string} issueId - the Id of the issue to delete
   * @param {string} worklogId - the Id of the worklog in issue to delete
   */
  deleteWorklog(issueId, worklogId) {
    return this.doRequest(this.makeRequestHeader(`/issue/${issueId}/worklog/${worklogId}`, {
      method: 'DELETE',
      followAllRedirects: true
    }));
  }

  /** List all Issue Types jira knows about
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id295946)
   * @name listIssueTypes
   * @function
   */
  listIssueTypes() {
    return this.doRequest(this.makeRequestHeader(`/issuetype`));
  }

  /** Register a webhook
   * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
   * @name registerWebhook
   * @function
   * @param {object} webhook - properly formatted webhook
   */
  registerWebhook(webhook) {
    return this.doRequest(this.makeRequestHeader(`/webhook`, {
      method: 'POST',
      body: webhook
    }));
  }

  /** List all registered webhooks
   * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
   * @name listWebhooks
   * @function
   */
  listWebhooks() {
    return this.doRequest(this.makeRequestHeader(`/webhook`));
  }

  /** Get a webhook by its ID
   * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
   * @name getWebhook
   * @function
   * @param {string} webhookID - id of webhook to get
   */
  getWebhook(webhookID) {
    return this.doRequest(this.makeRequestHeader(`/webhook/${webhookID}`));
  }

  /** Delete a registered webhook
   * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
   * @name issueLink
   * @function
   * @param {string} webhookID - id of the webhook to delete
   */
  deleteWebhook(webhookID) {
    return this.doRequest(this.makeRequestHeader(`/webhook/${webhookID}`, {
      method: 'DELETE'
    }));
  }

  /** Describe the currently authenticated user
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id2e865)
   * @name getCurrentUser
   * @function
   */
  getCurrentUser() {
    return this.doRequest(this.makeRequestHeader(`/session`));
  }

  /** Retrieve the backlog of a certain Rapid View
   * @name getBacklogForRapidView
   * @function
   * @param {string} rapidViewId - rapid view id
   */
  getBacklogForRapidView(rapidViewId) {
    return this.doRequest(this.makeRequestHeader(`/xboard/plan/backlog/data`, {
      qs: {
        rapidViewId
      }
    }));
  }

  /** Add attachment to a Issue
   * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#api/2/issue/{issueIdOrKey}/attachments-addAttachment)
   * @name addAttachmentOnIssue
   * @function
   * @param {string} issueId - issue id
   * @param {object} readStream - readStream object from fs
   */
  addAttachmentOnIssue(issueId, readStream) {
    return this.doRequest(this.makeRequestHeader(`/issue/${issueId}/attachments`, {
      method: 'POST',
      headers: {
        'X-Atlassian-Token': 'nocheck'
      },
      formData: {
        file: readStream
      }
    }));
  }

  /** Get list of possible statuses
   * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#api/2/status-getStatuses)
   * @name listStatus
   * @function
   */
  listStatus() {
    return this.doRequest(this.makeRequestHeader(`/status`));
  }
}
