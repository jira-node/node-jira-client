import request from 'request-promise';
import url from 'url';

/**
 * @name JiraApi
 * @class
 * Wrapper for the JIRA Rest Api
 * https://docs.atlassian.com/jira/REST/6.4.8/
 */
export default class JiraApi {
  /**
   * @constructor
   * @function
   * @param {JiraApiOptions} options
   */
  constructor(options) {
    this.protocol = options.protocol || 'http';
    this.host = options.host;
    this.port = options.port || null;
    this.apiVersion = options.apiVersion || '2';
    this.base = options.base || '';
    this.intermediatePath = options.intermediatePath;
    this.strictSSL = options.hasOwnProperty('strictSSL') ? options.strictSSL : true;
    // This is so we can fake during unit tests
    this.request = options.request || request;
    this.webhookVersion = options.webHookVersion || '1.0';
    this.greenhopperVersion = options.greenhopperVersion || '1.0';
    this.baseOptions = {};

    if (options.oauth && options.oauth.consumer_key && options.oauth.access_token) {
      this.baseOptions.oauth = {
        consumer_key: options.oauth.consumer_key,
        consumer_secret: options.oauth.consumer_secret,
        token: options.oauth.access_token,
        token_secret: options.oauth.access_token_secret,
        signature_method: options.oauth.signature_method || 'RSA-SHA1',
      };
    } else if (options.bearer) {
      this.baseOptions.auth = {
        user: '',
        pass: '',
        sendImmediately: true,
        bearer: options.bearer,
      };
    } else if (options.username && options.password) {
      this.baseOptions.auth = {
        user: options.username,
        pass: options.password,
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
   * @property {string} [port] - What port is this tool connecting to jira with? Only needed for
   * none standard ports. Ex: 8080, 3000, etc
   * @property {string} [username] - Specify a username for this tool to authenticate all
   * requests with.
   * @property {string} [password] - Specify a password for this tool to authenticate all
   * requests with.
   * @property {string} [apiVersion=2] - What version of the jira rest api is the instance the
   * tool is connecting to?
   * @property {string} [base] - What other url parts exist, if any, before the rest/api/
   * section?
   * @property {string} [intermediatePath] - If specified, overwrites the default rest/api/version
   * section of the uri
   * @property {boolean} [strictSSL=true] - Does this tool require each request to be
   * authenticated?  Defaults to true.
   * @property {function} [request] - What method does this tool use to make its requests?
   * Defaults to request from request-promise
   * @property {number} [timeout] - Integer containing the number of milliseconds to wait for a
   * server to send response headers (and start the response body) before aborting the request. Note
   * that if the underlying TCP connection cannot be established, the OS-wide TCP connection timeout
   * will overrule the timeout option ([the default in Linux can be anywhere from 20-120 *
   * seconds](http://www.sekuda.com/overriding_the_default_linux_kernel_20_second_tcp_socket_connect_timeout)).
   * @property {string} [webhookVersion=1.0] - What webhook version does this api wrapper need to
   * hit?
   * @property {string} [greenhopperVersion=1.0] - What webhook version does this api wrapper need
   * to hit?
   * @property {OAuth} - Specify an oauth object for this tool to authenticate all requests using
   * OAuth.
   */

  /**
   * @typedef OAuth
   * @type {object}
   * @property {string} consumer_key - The consumer entered in Jira Preferences.
   * @property {string} consumer_secret - The private RSA file.
   * @property {string} access_token - The generated access token.
   * @property {string} access_token_secret - The generated access toke secret.
   * @property {string} signature_method [signature_method=RSA-SHA1] - OAuth signurate methode
   * Possible values RSA-SHA1, HMAC-SHA1, PLAINTEXT. Jira Cloud supports only RSA-SHA1.
   */

  /**
   *  @typedef {object} UriOptions
   *  @property {string} pathname - The url after the specific functions path
   *  @property {object} [query] - An object of all query parameters
   *  @property {string} [intermediatePath] - Overwrites with specified path
   */

  /**
   * @name makeRequestHeader
   * @function
   * Creates a requestOptions object based on the default template for one
   * @param {string} uri
   * @param {object} [options] - an object containing fields and formatting how the
   */
  makeRequestHeader(uri, options = {}) {
    return {
      rejectUnauthorized: this.strictSSL,
      method: options.method || 'GET',
      uri,
      json: true,
      ...options,
    };
  }

  /**
   * @typedef makeRequestHeaderOptions
   * @type {object}
   * @property {string} [method] - HTTP Request Method. ie GET, POST, PUT, DELETE
   */

  /**
   * @name makeUri
   * @function
   * Creates a URI object for a given pathname
   * @param {object} [options] - an object containing path information
   */
  makeUri({ pathname, query, intermediatePath }) {
    const intermediateToUse = this.intermediatePath || intermediatePath;
    const tempPath = intermediateToUse || `/rest/api/${this.apiVersion}`;
    const uri = url.format({
      protocol: this.protocol,
      hostname: this.host,
      port: this.port,
      pathname: `${this.base}${tempPath}${pathname}`,
      query,
    });
    return decodeURIComponent(uri);
  }

  /**
   * @typedef makeUriOptions
   * @type {object}
   * @property {string} pathname - The url after the /rest/api/version
   * @property {object} query - a query object
   * @property {string} intermediatePath - If specified will overwrite the /rest/api/version section
   */

  /**
   * @name makeWebhookUri
   * @function
   * Creates a URI object for a given pathName
   * @param {object} [options] - An options object specifying uri information
   */
  makeWebhookUri({ pathname, intermediatePath }) {
    const intermediateToUse = this.intermediatePath || intermediatePath;
    const tempPath = intermediateToUse || `/rest/webhooks/${this.webhookVersion}`;
    const uri = url.format({
      protocol: this.protocol,
      hostname: this.host,
      port: this.port,
      pathname: `${this.base}${tempPath}${pathname}`,
    });
    return decodeURIComponent(uri);
  }

  /**
   * @typedef makeWebhookUriOptions
   * @type {object}
   * @property {string} pathname - The url after the /rest/webhooks
   * @property {string} intermediatePath - If specified will overwrite the /rest/webhooks section
   */

  /**
   * @name makeSprintQueryUri
   * @function
   * Creates a URI object for a given pathName
   * @param {object} [options] - The url after the /rest/
   */
  makeSprintQueryUri({ pathname, query, intermediatePath }) {
    const intermediateToUse = this.intermediatePath || intermediatePath;
    const tempPath = intermediateToUse || `/rest/greenhopper/${this.greenhopperVersion}`;
    const uri = url.format({
      protocol: this.protocol,
      hostname: this.host,
      port: this.port,
      pathname: `${this.base}${tempPath}${pathname}`,
      query,
    });
    return decodeURIComponent(uri);
  }

  /**
   * @typedef makeSprintQueryUriOptions
   * @type {object}
   * @property {string} pathname - The url after the /rest/api/version
   * @property {object} query - a query object
   * @property {string} intermediatePath - will overwrite the /rest/greenhopper/version section
   */

  /**
   * @typedef makeDevStatusUri
   * @function
   * Creates a URI object for a given pathname
   * @arg {pathname, query, intermediatePath} obj1
   * @param {string} pathname obj1.pathname - The url after the /rest/api/version
   * @param {object} query obj1.query - a query object
   * @param {string} intermediatePath obj1.intermediatePath - If specified will overwrite the
   * /rest/dev-status/latest/issue/detail section
   */
  makeDevStatusUri({ pathname, query, intermediatePath }) {
    const intermediateToUse = this.intermediatePath || intermediatePath;
    const tempPath = intermediateToUse || '/rest/dev-status/latest/issue';
    const uri = url.format({
      protocol: this.protocol,
      hostname: this.host,
      port: this.port,
      pathname: `${this.base}${tempPath}${pathname}`,
      query,
    });
    return decodeURIComponent(uri);
  }

  /**
   * @name makeAgile1Uri
   * @function
   * Creates a URI object for a given pathname
   * @param {UriOptions} object
   */
  makeAgileUri(object) {
    const intermediateToUse = this.intermediatePath || object.intermediatePath;
    const tempPath = intermediateToUse || '/rest/agile/1.0';
    const uri = url.format({
      protocol: this.protocol,
      hostname: this.host,
      port: this.port,
      pathname: `${this.base}${tempPath}${object.pathname}`,
      query: object.query,
    });
    return decodeURIComponent(uri);
  }

  /**
   * @name makeServiceDeskUri
   * @function
   * Creates a URI object for a given pathname
   * @param {UriOptions} object
   */
  makeServiceDeskUri(object) {
    const intermediateToUse = this.intermediatePath || object.intermediatePath;
    const tempPath = intermediateToUse || '/rest/servicedeskapi';
    const uri = url.format({
      protocol: this.protocol,
      hostname: this.host,
      port: this.port,
      pathname: `${this.base}${tempPath}${object.pathname}`,
      query: object.query,
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
      ...requestOptions,
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
   * @param {string} expand - The resource expansion to return additional fields in the response
   * @param {string} fields - Comma separated list of field ids or keys to retrieve
   * @param {string} properties - Comma separated list of properties to retrieve
   * @param {boolean} fieldsByKeys - False by default, used to retrieve fields by key instead of id
   */
  findIssue(issueNumber, expand, fields, properties, fieldsByKeys) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/issue/${issueNumber}`,
      query: {
        expand: expand || '',
        fields: fields || '*all',
        properties: properties || '*all',
        fieldsByKeys: fieldsByKeys || false,
      },
    })));
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
    const requestHeaders = this.makeRequestHeader(
      this.makeUri({
        pathname: `/version/${version}/unresolvedIssueCount`,
      }),
    );
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
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/project/${project}`,
    })));
  }

  /**
   * @name createProject
   * @function
   * Create a new Project
   * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#api/2/project-createProject)
   * @param {object} project - with specs
   */
  createProject(project) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/project/',
    }), {
      method: 'POST',
      body: project,
    }));
  }

  /** Find the Rapid View for a specified project
   * @name findRapidView
   * @function
   * @param {string} projectName - name for the project
   */
  async findRapidView(projectName) {
    const response = await this.doRequest(this.makeRequestHeader(this.makeSprintQueryUri({
      pathname: '/rapidviews/list',
    })));

    if (typeof projectName === 'undefined' || projectName === null) return response.views;

    const rapidViewResult = response.views
      .find(x => x.name.toLowerCase() === projectName.toLowerCase());

    return rapidViewResult;
  }

  /** Get the most recent sprint for a given rapidViewId
   * @name getLastSprintForRapidView
   * @function
   * @param {string} rapidViewId - the id for the rapid view
   */
  async getLastSprintForRapidView(rapidViewId) {
    const response = await this.doRequest(
      this.makeRequestHeader(this.makeSprintQueryUri({
        pathname: `/sprintquery/${rapidViewId}`,
      })),
    );
    return response.sprints.pop();
  }

  /** Get the issues for a rapidView / sprint
   * @name getSprintIssues
   * @function
   * @param {string} rapidViewId - the id for the rapid view
   * @param {string} sprintId - the id for the sprint
   */
  getSprintIssues(rapidViewId, sprintId) {
    return this.doRequest(this.makeRequestHeader(this.makeSprintQueryUri({
      pathname: '/rapid/charts/sprintreport',
      query: {
        rapidViewId,
        sprintId,
      },
    })));
  }

  /** Get a list of Sprints belonging to a Rapid View
   * @name listSprints
   * @function
   * @param {string} rapidViewId - the id for the rapid view
   */
  listSprints(rapidViewId) {
    return this.doRequest(this.makeRequestHeader(this.makeSprintQueryUri({
      pathname: `/sprintquery/${rapidViewId}`,
    })));
  }

  /** Add an issue to the project's current sprint
   * @name addIssueToSprint
   * @function
   * @param {string} issueId - the id of the existing issue
   * @param {string} sprintId - the id of the sprint to add it to
   */
  addIssueToSprint(issueId, sprintId) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/sprint/${sprintId}/issues/add`,
    }), {
      method: 'PUT',
      followAllRedirects: true,
      body: {
        issueKeys: [issueId],
      },
    }));
  }

  /** Create an issue link between two issues
   * @name issueLink
   * @function
   * @param {object} link - a link object formatted how the Jira API specifies
   */
  issueLink(link) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/issueLink',
    }), {
      method: 'POST',
      followAllRedirects: true,
      body: link,
    }));
  }

  /** Retrieves the remote links associated with the given issue.
   * @name getRemoteLinks
   * @function
   * @param {string} issueNumber - the issue number to find remote links for.
   */
  getRemoteLinks(issueNumber) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/issue/${issueNumber}/remotelink`,
    })));
  }

  /**
   * @name createRemoteLink
   * @function
   * Creates a remote link associated with the given issue.
   * @param {string} issueNumber - The issue number to create the remotelink under
   * @param {object} remoteLink - the remotelink object as specified by the Jira API
   */
  createRemoteLink(issueNumber, remoteLink) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/issue/${issueNumber}/remotelink`,
    }), {
      method: 'POST',
      body: remoteLink,
    }));
  }

  /** Get Versions for a project
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289653)
   * @name getVersions
   * @function
   * @param {string} project - A project key to get versions for
   */
  getVersions(project) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/project/${project}/versions`,
    })));
  }

  /** Create a version
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id288232)
   * @name createVersion
   * @function
   * @param {string} version - an object of the new version
   */
  createVersion(version) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/version',
    }), {
      method: 'POST',
      followAllRedirects: true,
      body: version,
    }));
  }

  /** Update a version
   * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#d2e510)
   * @name updateVersion
   * @function
   * @param {string} version - an new object of the version to update
   */
  updateVersion(version) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/version/${version.id}`,
    }), {
      method: 'PUT',
      followAllRedirects: true,
      body: version,
    }));
  }

  /** Delete a version
   * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#api/2/version-delete)
   * @name deleteVersion
   * @function
   * @param {string} versionId - the ID of the version to delete
   * @param {string} moveFixIssuesToId - when provided, existing fixVersions will be moved
   *                 to this ID. Otherwise, the deleted version will be removed from all
   *                 issue fixVersions.
   * @param {string} moveAffectedIssuesToId - when provided, existing affectedVersions will
   *                 be moved to this ID. Otherwise, the deleted version will be removed
   *                 from all issue affectedVersions.
   */
  deleteVersion(versionId, moveFixIssuesToId, moveAffectedIssuesToId) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/version/${versionId}`,
    }), {
      method: 'DELETE',
      followAllRedirects: true,
      qs: {
        moveFixIssuesTo: moveFixIssuesToId,
        moveAffectedIssuesTo: moveAffectedIssuesToId,
      },
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
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/search',
    }), {
      method: 'POST',
      followAllRedirects: true,
      body: {
        jql: searchString,
        ...optional,
      },
    }));
  }

  /** Create a Jira user
   * [Jira Doc](https://docs.atlassian.com/jira/REST/cloud/#api/2/user-createUser)
   * @name createUser
   * @function
   * @param {object} user - Properly Formatted User object
   */
  createUser(user) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/user',
    }), {
      method: 'POST',
      followAllRedirects: true,
      body: user,
    }));
  }

  /** Delete a Jira user
   * [Jira Doc](https://developer.atlassian.com/cloud/jira/platform/rest/v2/#api-api-2-user-delete)
   * @name deleteUser
   * @function
   * @param {object} user - an object containing user reference : accou
   */
  deleteUser(accountId) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/user',
    }), {
      method: 'DELETE',
      followAllRedirects: true,
      query: {accountId: accountId},
    }));
  }

  /** Search user on Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#d2e3756)
   * @name searchUsers
   * @function
   * @param {SearchUserOptions} options
   */
  searchUsers({ username, startAt, maxResults, includeActive, includeInactive }) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/user/search',
      query: {
        username,
        startAt: startAt || 0,
        maxResults: maxResults || 50,
        includeActive: includeActive || true,
        includeInactive: includeInactive || false,
      },
    }), {
      followAllRedirects: true,
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
   * @param {string} groupname - A query string used to search users in group
   * @param {integer} [startAt=0] - The index of the first user to return (0-based)
   * @param {integer} [maxResults=50] - The maximum number of users to return (defaults to 50).
   */
  getUsersInGroup(groupname, startAt = 0, maxResults = 50) {
    return this.doRequest(
      this.makeRequestHeader(this.makeUri({
        pathname: '/group',
        query: {
          groupname,
          expand: `users[${startAt}:${maxResults}]`,
        },
      }), {
        followAllRedirects: true,
      }),
    );
  }

  /** Get issues related to a user
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id296043)
   * @name getUsersIssues
   * @function
   * @param {string} username - username of user to search for
   * @param {boolean} open - determines if only open issues should be returned
   */
  getUsersIssues(username, open) {
    const openJql = open ? ' AND status in (Open, \'In Progress\', Reopened)' : '';
    return this.searchJira(
      `assignee = ${username.replace('@', '\\u0040')}${openJql}`, {});
  }

  /** Add issue to Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290028)
   * @name addNewIssue
   * @function
   * @param {object} issue - Properly Formatted Issue object
   */
  addNewIssue(issue) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/issue',
    }), {
      method: 'POST',
      followAllRedirects: true,
      body: issue,
    }));
  }

  /** Add a user as a watcher on an issue
   * @name addWatcher
   * @function
   * @param {string} issueKey - the key of the existing issue
   * @param {string} username - the jira username to add as a watcher to the issue
   */
  addWatcher(issueKey, username) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/issue/${issueKey}/watchers`,
    }), {
      method: 'POST',
      followAllRedirects: true,
      body: JSON.stringify(username),
    }));
  }

  /** Delete issue from Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290791)
   * @name deleteIssue
   * @function
   * @param {string} issueId - the Id of the issue to delete
   */
  deleteIssue(issueId) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/issue/${issueId}`,
    }), {
      method: 'DELETE',
      followAllRedirects: true,
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
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/issue/${issueId}`,
    }), {
      body: issueUpdate,
      method: 'PUT',
      followAllRedirects: true,
    }));
  }

  /** List Components
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
   * @name listComponents
   * @function
   * @param {string} project - key for the project
   */
  listComponents(project) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/project/${project}/components`,
    })));
  }

  /** Add component to Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290028)
   * @name addNewComponent
   * @function
   * @param {object} component - Properly Formatted Component
   */
  addNewComponent(component) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/component',
    }), {
      method: 'POST',
      followAllRedirects: true,
      body: component,
    }));
  }

  /** Delete component from Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290791)
   * @name deleteComponent
   * @function
   * @param {string} componentId - the Id of the component to delete
   */
  deleteComponent(componentId) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/component/${componentId}`,
    }), {
      method: 'DELETE',
      followAllRedirects: true,
    }));
  }

  /** Create custom Jira field
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#api/2/field-createCustomField)
   * @name createCustomField
   * @function
   * @param {object} field - Properly formatted Field object
   */
  createCustomField(field) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/field',
    }), {
      method: 'POST',
      followAllRedirects: true,
      body: field,
    }));
  }

  /** List all fields custom and not that jira knows about.
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
   * @name listFields
   * @function
   */
  listFields() {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/field',
    })));
  }

  /** Add an option for a select list issue field.
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#api/2/field/{fieldKey}/option-createOption)
   * @name createFieldOption
   * @function
   * @param {string} fieldKey - the key of the select list field
   * @param {object} option - properly formatted Option object
   */
  createFieldOption(fieldKey, option) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/field/${fieldKey}/option`,
    }), {
      method: 'POST',
      followAllRedirects: true,
      body: option,
    }));
  }

  /** Returns all options defined for a select list issue field.
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#api/2/field/{fieldKey}/option-getAllOptions)
   * @name listFieldOptions
   * @function
   * @param {string} fieldKey - the key of the select list field
   */
  listFieldOptions(fieldKey) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/field/${fieldKey}/option`,
    })));
  }

  /** Creates or updates an option for a select list issue field.
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#api/2/field/{fieldKey}/option-putOption)
   * @name upsertFieldOption
   * @function
   * @param {string} fieldKey - the key of the select list field
   * @param {string} optionId - the id of the modified option
   * @param {object} option - properly formatted Option object
   */
  upsertFieldOption(fieldKey, optionId, option) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/field/${fieldKey}/option/${optionId}`,
    }), {
      method: 'PUT',
      followAllRedirects: true,
      body: option,
    }));
  }

  /** Returns an option for a select list issue field.
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#api/2/field/{fieldKey}/option-getOption)
   * @name getFieldOption
   * @function
   * @param {string} fieldKey - the key of the select list field
   * @param {string} optionId - the id of the option
   */
  getFieldOption(fieldKey, optionId) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/field/${fieldKey}/option/${optionId}`,
    })));
  }

  /** Deletes an option from a select list issue field.
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#api/2/field/{fieldKey}/option-delete)
   * @name deleteFieldOption
   * @function
   * @param {string} fieldKey - the key of the select list field
   * @param {string} optionId - the id of the deleted option
   */
  deleteFieldOption(fieldKey, optionId) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/field/${fieldKey}/option/${optionId}`,
    }), {
      method: 'DELETE',
      followAllRedirects: true,
    }));
  }

  /**
   * @name getIssueProperty
   * @function
   * Get Property of Issue by Issue and Property Id
   * [Jira Doc](https://docs.atlassian.com/jira/REST/cloud/#api/2/issue/{issueIdOrKey}/properties-getProperty)
   * @param {string} issueNumber - The issue number to search for including the project key
   * @param {string} property - The property key to search for
   */
  getIssueProperty(issueNumber, property) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/issue/${issueNumber}/properties/${property}`,
    })));
  }

  /** List all priorities jira knows about
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
   * @name listPriorities
   * @function
   */
  listPriorities() {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/priority',
    })));
  }

  /** List Transitions for a specific issue that are available to the current user
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
   * @name listTransitions
   * @function
   * @param {string} issueId - get transitions available for the issue
   */
  listTransitions(issueId) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/issue/${issueId}/transitions`,
      query: {
        expand: 'transitions.fields',
      },
    })));
  }

  /** Transition issue in Jira
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id290489)
   * @name transitionsIssue
   * @function
   * @param {string} issueId - the Id of the issue to delete
   * @param {object} issueTransition - transition object from the jira rest API
   */
  transitionIssue(issueId, issueTransition) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/issue/${issueId}/transitions`,
    }), {
      body: issueTransition,
      method: 'POST',
      followAllRedirects: true,
    }));
  }

  /** List all Viewable Projects
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id289193)
   * @name listProjects
   * @function
   */
  listProjects() {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/project',
    })));
  }

  /** Add a comment to an issue
   * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#id108798)
   * @name addComment
   * @function
   * @param {string} issueId - Issue to add a comment to
   * @param {string} comment - string containing comment
   */
  addComment(issueId, comment) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/issue/${issueId}/comment`,
    }), {
      body: {
        body: comment,
      },
      method: 'POST',
      followAllRedirects: true,
    }));
  }

  /** Update comment for an issue
   * [Jira Doc](https://docs.atlassian.com/jira/REST/cloud/#api/2/issue-updateComment)
   * @name updateComment
   * @function
   * @param {string} issueId - Issue with the comment
   * @param {string} commentId - Comment that is updated
   * @param {string} comment - string containing new comment
   * @param {object} [options={}] - extra options
   */
  updateComment(issueId, commentId, comment, options = {}) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/issue/${issueId}/comment/${commentId}`,
    }), {
      body: {
        body: comment,
        ...options,
      },
      method: 'PUT',
      followAllRedirects: true,
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
    const header = {
      uri: this.makeUri({
        pathname: `/issue/${issueId}/worklog`,
        query: { adjustEstimate: 'new', newEstimate },
      }),
      body: worklog,
      method: 'POST',
      'Content-Type': 'application/json',
      json: true,
    };

    return this.doRequest(header);
  }

  /** Delete worklog from issue
   * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#d2e1673)
   * @name deleteWorklog
   * @function
   * @param {string} issueId - the Id of the issue to delete
   * @param {string} worklogId - the Id of the worklog in issue to delete
   */
  deleteWorklog(issueId, worklogId) {
    return this.doRequest(this.makeRequestHeader(
      this.makeUri({
        pathname: `/issue/${issueId}/worklog/${worklogId}`,
      }), {
        method: 'DELETE',
        followAllRedirects: true,
      },
    ));
  }

  /** List all Issue Types jira knows about
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id295946)
   * @name listIssueTypes
   * @function
   */
  listIssueTypes() {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/issuetype',
    })));
  }

  /** Register a webhook
   * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
   * @name registerWebhook
   * @function
   * @param {object} webhook - properly formatted webhook
   */
  registerWebhook(webhook) {
    return this.doRequest(this.makeRequestHeader(this.makeWebhookUri({
      pathname: '/webhook',
    }), {
      method: 'POST',
      body: webhook,
    }));
  }

  /** List all registered webhooks
   * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
   * @name listWebhooks
   * @function
   */
  listWebhooks() {
    return this.doRequest(this.makeRequestHeader(this.makeWebhookUri({
      pathname: '/webhook',
    })));
  }

  /** Get a webhook by its ID
   * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
   * @name getWebhook
   * @function
   * @param {string} webhookID - id of webhook to get
   */
  getWebhook(webhookID) {
    return this.doRequest(this.makeRequestHeader(this.makeWebhookUri({
      pathname: `/webhook/${webhookID}`,
    })));
  }

  /** Delete a registered webhook
   * [Jira Doc](https://developer.atlassian.com/display/JIRADEV/JIRA+Webhooks+Overview)
   * @name issueLink
   * @function
   * @param {string} webhookID - id of the webhook to delete
   */
  deleteWebhook(webhookID) {
    return this.doRequest(this.makeRequestHeader(this.makeWebhookUri({
      pathname: `/webhook/${webhookID}`,
    }), {
      method: 'DELETE',
    }));
  }

  /** Describe the currently authenticated user
   * [Jira Doc](http://docs.atlassian.com/jira/REST/latest/#id2e865)
   * @name getCurrentUser
   * @function
   */
  getCurrentUser() {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/myself',
    })));
  }

  /** Retrieve the backlog of a certain Rapid View
   * @name getBacklogForRapidView
   * @function
   * @param {string} rapidViewId - rapid view id
   */
  getBacklogForRapidView(rapidViewId) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/xboard/plan/backlog/data',
      query: {
        rapidViewId,
      },
    })));
  }

  /** Add attachment to a Issue
   * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#api/2/issue/{issueIdOrKey}/attachments-addAttachment)
   * @name addAttachmentOnIssue
   * @function
   * @param {string} issueId - issue id
   * @param {object} readStream - readStream object from fs
   */
  addAttachmentOnIssue(issueId, readStream) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/issue/${issueId}/attachments`,
    }), {
      method: 'POST',
      headers: {
        'X-Atlassian-Token': 'nocheck',
      },
      formData: {
        file: readStream,
      },
    }));
  }

  /** Notify people related to issue
   * [Jira Doc](https://docs.atlassian.com/jira/REST/cloud/#api/2/issue-notify)
   * @name issueNotify
   * @function
   * @param {string} issueId - issue id
   * @param {object} notificationBody - properly formatted body
   */
  issueNotify(issueId, notificationBody) {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: `/issue/${issueId}/notify`,
    }), {
      method: 'POST',
      body: notificationBody,
    }));
  }

  /** Get list of possible statuses
   * [Jira Doc](https://docs.atlassian.com/jira/REST/latest/#api/2/status-getStatuses)
   * @name listStatus
   * @function
   */
  listStatus() {
    return this.doRequest(this.makeRequestHeader(this.makeUri({
      pathname: '/status',
    })));
  }

  /** Get a Dev-Status summary by issue ID
   * @name getDevStatusSummary
   * @function
   * @param {string} issueId - id of issue to get
   */
  getDevStatusSummary(issueId) {
    return this.doRequest(this.makeRequestHeader(this.makeDevStatusUri({
      pathname: '/summary',
      query: {
        issueId,
      },
    })));
  }

  /** Get a Dev-Status detail by issue ID
   * @name getDevStatusDetail
   * @function
   * @param {string} issueId - id of issue to get
   * @param {string} applicationType - type of application (stash, bitbucket)
   * @param {string} dataType - info to return (repository, pullrequest)
   */
  getDevStatusDetail(issueId, applicationType, dataType) {
    return this.doRequest(this.makeRequestHeader(this.makeDevStatusUri({
      pathname: '/detail',
      query: {
        issueId,
        applicationType,
        dataType,
      },
    })));
  }

  /** Move issues to backlog
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/backlog-moveIssuesToBacklog)
   * @name moveToBacklog
   * @function
   * @param {array} issues - id or key of issues to get
   */
  moveToBacklog(issues) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: '/backlog/issue',
    }), {
      method: 'POST',
      body: {
        issues,
      },
    }));
  }

  /** Get all boards
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board-getAllBoards)
   * @name getAllBoards
   * @function
   * @param {number} [startAt=0] - The starting index of the returned boards.
   * @param {number} [maxResults=50] - The maximum number of boards to return per page.
   * @param {string} [type] - Filters results to boards of the specified type.
   * @param {string} [name] - Filters results to boards that match the specified name.
   * @param {string} [projectKeyOrId] - Filters results to boards that are relevant to a project.
   */
  getAllBoards(startAt = 0, maxResults = 50, type, name, projectKeyOrId) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: '/board',
      query: {
        startAt,
        maxResults,
        type,
        name,
        projectKeyOrId,
      },
    })));
  }

  /** Create Board
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board-createBoard)
   * @name createBoard
   * @function
   * @param {object} boardBody - Board name, type and filter Id is required.
   * @param {string} boardBody.type - Valid values: scrum, kanban
   * @param {string} boardBody.name - Must be less than 255 characters.
   * @param {string} boardBody.filterId - Id of a filter that the user has permissions to view.
   */
  createBoard(boardBody) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: '/board',
    }), {
      method: 'POST',
      body: boardBody,
    }));
  }

  /** Get Board
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board-getBoard)
   * @name getBoard
   * @function
   * @param {string} boardId - Id of board to retrieve
   */
  getBoard(boardId) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}`,
    })));
  }

  /** Delete Board
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board-deleteBoard)
   * @name deleteBoard
   * @function
   * @param {string} boardId - Id of board to retrieve
   */
  deleteBoard(boardId) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}`,
    }), {
      method: 'DELETE',
    }));
  }

  /** Get issues for backlog
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board-getIssuesForBacklog)
   * @name getIssuesForBacklog
   * @function
   * @param {string} boardId - Id of board to retrieve
   * @param {number} [startAt=0] - The starting index of the returned issues. Base index: 0.
   * @param {number} [maxResults=50] - The maximum number of issues to return per page. Default: 50.
   * @param {string} [jql] - Filters results using a JQL query.
   * @param {boolean} [validateQuery] - Specifies whether to validate the JQL query or not.
   * Default: true.
   * @param {string} [fields] - The list of fields to return for each issue.
   */
  getIssuesForBacklog(boardId, startAt = 0, maxResults = 50, jql, validateQuery = true, fields) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}/backlog`,
      query: {
        startAt,
        maxResults,
        jql,
        validateQuery,
        fields,
      },
    })));
  }

  /** Get Configuration
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board-getConfiguration)
   * @name getConfiguration
   * @function
   * @param {string} boardId - Id of board to retrieve
   */
  getConfiguration(boardId) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}/configuration`,
    })));
  }

  /** Get issues for board
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board-getIssuesForBoard)
   * @name getIssuesForBoard
   * @function
   * @param {string} boardId - Id of board to retrieve
   * @param {number} [startAt=0] - The starting index of the returned issues. Base index: 0.
   * @param {number} [maxResults=50] - The maximum number of issues to return per page. Default: 50.
   * @param {string} [jql] - Filters results using a JQL query.
   * @param {boolean} [validateQuery] - Specifies whether to validate the JQL query or not.
   * Default: true.
   * @param {string} [fields] - The list of fields to return for each issue.
   */
  getIssuesForBoard(boardId, startAt = 0, maxResults = 50, jql, validateQuery = true, fields) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}/issue`,
      query: {
        startAt,
        maxResults,
        jql,
        validateQuery,
        fields,
      },
    })));
  }

  /** Get Epics
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/epic-getEpics)
   * @name getEpics
   * @function
   * @param {string} boardId - Id of board to retrieve
   * @param {number} [startAt=0] - The starting index of the returned epics. Base index: 0.
   * @param {number} [maxResults=50] - The maximum number of epics to return per page. Default: 50.
   * @param {string} [done] - Filters results to epics that are either done or not done.
   * Valid values: true, false.
   */
  getEpics(boardId, startAt = 0, maxResults = 50, done) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}/epic`,
      query: {
        startAt,
        maxResults,
        done,
      },
    })));
  }

  /** Get board issues for epic
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/epic-getIssuesForEpic)
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/epic-getIssuesWithoutEpic)
   * @name getBoardIssuesForEpic
   * @function
   * @param {string} boardId - Id of board to retrieve
   * @param {string} epicId - Id of epic to retrieve, specify 'none' to get issues without an epic.
   * @param {number} [startAt=0] - The starting index of the returned issues. Base index: 0.
   * @param {number} [maxResults=50] - The maximum number of issues to return per page. Default: 50.
   * @param {string} [jql] - Filters results using a JQL query.
   * @param {boolean} [validateQuery] - Specifies whether to validate the JQL query or not.
   * Default: true.
   * @param {string} [fields] - The list of fields to return for each issue.
   */
  getBoardIssuesForEpic(boardId, epicId, startAt = 0, maxResults = 50, jql,
    validateQuery = true, fields) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}/epic/${epicId}/issue`,
      query: {
        startAt,
        maxResults,
        jql,
        validateQuery,
        fields,
      },
    })));
  }

  /** Get Projects
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/project-getProjects)
   * @name getProjects
   * @function
   * @param {string} boardId - Id of board to retrieve
   * @param {number} [startAt=0] - The starting index of the returned projects. Base index: 0.
   * @param {number} [maxResults=50] - The maximum number of projects to return per page.
   * Default: 50.
   */
  getProjects(boardId, startAt = 0, maxResults = 50) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}/project`,
      query: {
        startAt,
        maxResults,
      },
    })));
  }

  /** Get Projects Full
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/project-getProjectsFull)
   * @name getProjectsFull
   * @function
   * @param {string} boardId - Id of board to retrieve
   */
  getProjectsFull(boardId) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}/project/full`,
    })));
  }

  /** Get Board Properties Keys
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/properties-getPropertiesKeys)
   * @name getBoardPropertiesKeys
   * @function
   * @param {string} boardId - Id of board to retrieve
   */
  getBoardPropertiesKeys(boardId) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}/properties`,
    })));
  }

  /** Delete Board Property
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/properties-deleteProperty)
   * @name deleteBoardProperty
   * @function
   * @param {string} boardId - Id of board to retrieve
   * @param {string} propertyKey - Id of property to delete
   */
  deleteBoardProperty(boardId, propertyKey) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}/properties/${propertyKey}`,
    }), {
      method: 'DELETE',
    }));
  }

  /** Set Board Property
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/properties-setProperty)
   * @name setBoardProperty
   * @function
   * @param {string} boardId - Id of board to retrieve
   * @param {string} propertyKey - Id of property to delete
   * @param {string} body - value to set, for objects make sure to stringify first
   */
  setBoardProperty(boardId, propertyKey, body) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}/properties/${propertyKey}`,
    }), {
      method: 'PUT',
      body,
    }));
  }

  /** Get Board Property
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/properties-getProperty)
   * @name getBoardProperty
   * @function
   * @param {string} boardId - Id of board to retrieve
   * @param {string} propertyKey - Id of property to retrieve
   */
  getBoardProperty(boardId, propertyKey) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}/properties/${propertyKey}`,
    })));
  }

  /** Get All Sprints
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/sprint-getAllSprints)
   * @name getAllSprints
   * @function
   * @param {string} boardId - Id of board to retrieve
   * @param {number} [startAt=0] - The starting index of the returned sprints. Base index: 0.
   * @param {number} [maxResults=50] - The maximum number of sprints to return per page.
   * Default: 50.
   * @param {string} [state] - Filters results to sprints in specified states.
   * Valid values: future, active, closed.
   */
  getAllSprints(boardId, startAt = 0, maxResults = 50, state) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}/sprint`,
      query: {
        startAt,
        maxResults,
        state,
      },
    })));
  }

  /** Get Board issues for sprint
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/sprint-getIssuesForSprint)
   * @name getBoardIssuesForSprint
   * @function
   * @param {string} boardId - Id of board to retrieve
   * @param {string} sprintId - Id of sprint to retrieve
   * @param {number} [startAt=0] - The starting index of the returned issues. Base index: 0.
   * @param {number} [maxResults=50] - The maximum number of issues to return per page. Default: 50.
   * @param {string} [jql] - Filters results using a JQL query.
   * @param {boolean} [validateQuery] - Specifies whether to validate the JQL query or not.
   * Default: true.
   * @param {string} [fields] - The list of fields to return for each issue.
   */
  getBoardIssuesForSprint(boardId, sprintId, startAt = 0, maxResults = 50, jql,
    validateQuery = true, fields) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}/sprint/${sprintId}/issue`,
      query: {
        startAt,
        maxResults,
        jql,
        validateQuery,
        fields,
      },
    })));
  }

  /** Get All Versions
   * [Jira Doc](https://docs.atlassian.com/jira-software/REST/cloud/#agile/1.0/board/{boardId}/version-getAllVersions)
   * @name getAllVersions
   * @function
   * @param {string} boardId - Id of board to retrieve
   * @param {number} [startAt=0] - The starting index of the returned versions. Base index: 0.
   * @param {number} [maxResults=50] - The maximum number of versions to return per page.
   * Default: 50.
   * @param {string} [released] - Filters results to versions that are either released or
   * unreleased.Valid values: true, false.
   */
  getAllVersions(boardId, startAt = 0, maxResults = 50, released) {
    return this.doRequest(this.makeRequestHeader(this.makeAgileUri({
      pathname: `/board/${boardId}/version`,
      query: {
        startAt,
        maxResults,
        released,
      },
    })));
  }

  /** Add an organization.
   * [Jira Doc](https://docs.atlassian.com/jira-servicedesk/REST/3.15.1/#servicedeskapi/organization-createOrganization)
   * @name createOrganization
   */
  createOrganization(name) {
    return this.doRequest(this.makeRequestHeader(this.makeServiceDeskUri({
      pathname: `/organization`,
    }), {
      method: 'POST',
      followAllRedirects: true,
      body: {'name': name},
      headers: {
        'X-ExperimentalApi': 'opt-in'
      }
    }));
  }

  /** Get Organizations
   * [Jira Doc](https://docs.atlassian.com/jira-servicedesk/REST/3.15.1/#servicedeskapi/organization-getOrganizations)
   * @name getOrganization
   * @function
   * @param {number} [start=0] - The starting index of the returned versions. Base index: 0.
   * @param {number} [limit=50] - The maximum number of versions to return per page.
   * Default: 50.
   */
  getOrganizations(start = 0, limit = 50) {
    return this.doRequest(this.makeRequestHeader(this.makeServiceDeskUri({
      pathname: '/organization',
      query: {
        start,
        limit,
      },
    }), {
      headers: {
        'X-ExperimentalApi': 'opt-in',
      },
    }));
  }

  /** Get Organization
   * [Jira Doc](https://docs.atlassian.com/jira-servicedesk/REST/3.15.1/#servicedeskapi/organization-getOrganization)
   * @name getOrganization
   * @function
   * @param {string} organizationId - The organization indentifier.
   */
  getOrganization(organizationId) {
    return this.doRequest(this.makeRequestHeader(this.makeServiceDeskUri({
      pathname: `/organization/${organizationId}`,
    }), {
      headers: {
        'X-ExperimentalApi': 'opt-in',
      },
    }));
  }

  /** Get Users in an Organization
   * [Jira Doc](https://docs.atlassian.com/jira-servicedesk/REST/3.15.1/#servicedeskapi/organization-getUsersInOrganization)
   * @name getUsersInOrganization
   * @function
   * @param {string} organizationId - The organization indentifier.
   */
  getUsersInOrganization(organizationId) {
    return this.doRequest(this.makeRequestHeader(this.makeServiceDeskUri({
      pathname: `/organization/${organizationId}/user`,
    }), {
      headers: {
        'X-ExperimentalApi': 'opt-in',
      },
    }));
  }

  /** Add users to an Organization
   * [Jira Doc] (https://docs.atlassian.com/jira-servicedesk/REST/3.15.1/#servicedeskapi/organization-addUsersToOrganization)
   * @name addUsersToOrganization
   * @function
   * @param {string} usernames - the list of usernames of users to add
   * @param {string} organizationId - the id of the organization to add them to
   */
  addUsersToOrganization(usernames, organizationId) {
    return this.doRequest(this.makeRequestHeader(this.makeServiceDeskUri({
      pathname: `/organization/${organizationId}/user`,
    }), {
      method: 'POST',
      followAllRedirects: true,
      body: {
        usernames: usernames,
      },
      headers: {
        'X-ExperimentalApi': 'opt-in',
      },
    }));
  }

  /** Remove users from an Organization
   * [Jira Doc] (https://docs.atlassian.com/jira-servicedesk/REST/3.15.1/#servicedeskapi/organization-removeUsersFromOrganization)
   * @name aUsersToOrganization
   * @function
   * @param {string} usernames - the list of usernames of users to remove
   * @param {string} organizationId - the id of the organization to remove them from
   */
  removeUsersFromOrganization(usernames, organizationId) {
    return this.doRequest(this.makeRequestHeader(this.makeServiceDeskUri({
      pathname: `/organization/${organizationId}/user`,
    }), {
      method: 'DELETE',
      followAllRedirects: true,
      body: {
        usernames: usernames,
      },
      headers: {
        'X-ExperimentalApi': 'opt-in',
      },
    }));
  }
}
