import JiraApi from '../src/jira';

function getOptions(options) {
  const actualOptions = options || {};
  return {
    protocol: actualOptions.protocol || 'http',
    host: actualOptions.host || 'jira.somehost.com',
    port: actualOptions.port || '8080',
    username: actualOptions.username || 'someusername',
    password: actualOptions.password || 'somepassword',
    apiVersion: actualOptions.apiVersion || '2.0',
    base: actualOptions.base || '',
    strictSSL: actualOptions.hasOwnProperty('strictSSL') ? actualOptions.strictSSL : true,
    request: actualOptions.request,
    oauth: actualOptions.oauth || null,
    intermediatePath: actualOptions.intermediatePath,
    bearer: actualOptions.bearer || null,
  };
}

describe('Jira API Tests', () => {
  describe('Constructor Tests', () => {
    it('Constructor functions properly', () => {
      const jira = new JiraApi(getOptions());

      expect(jira.protocol).to.eql('http');
      expect(jira.host).to.eql('jira.somehost.com');
      expect(jira.port).to.eql('8080');
      expect(jira.baseOptions.auth.user).to.eql('someusername');
      expect(jira.baseOptions.auth.pass).to.eql('somepassword');
      expect(jira.apiVersion).to.eql('2.0');
    });

    it('Constructor with no auth credentials', () => {
      const { username, password, ...options } = getOptions();

      expect(options.username).to.not.eql(username);
      expect(options.password).to.not.eql(password);

      const jira = new JiraApi(options);

      expect(jira.baseOptions.auth).to.be.undefined;
    });

    it('Constructor with bearer credentials', () => {
      const options = getOptions({
        bearer: 'testBearer',
      });

      const jira = new JiraApi(options);

      expect(jira.baseOptions.auth).to.eql({
        user: '',
        pass: '',
        sendImmediately: true,
        bearer: options.bearer,
      });
    });

    it('Constructor with oauth credentials', () => {
      const options = getOptions({
        oauth: {
          consumer_key: 'consumer',
          consumer_secret: 'consumer_secret',
          access_token: 'token',
          access_token_secret: 'token_secret',
        },
      });

      const jira = new JiraApi(options);

      expect(jira.baseOptions.oauth).to.eql({
        consumer_key: 'consumer',
        consumer_secret: 'consumer_secret',
        token: 'token',
        token_secret: 'token_secret',
        signature_method: 'RSA-SHA1',
      });
    });

    it('Constructor with timeout', () => {
      const jira = new JiraApi({
        timeout: 2,
        ...getOptions(),
      });

      expect(jira.baseOptions.timeout).to.equal(2);
    });

    it('Constructor with strictSSL off', () => {
      const jira = new JiraApi(
        getOptions({
          strictSSL: false,
        }),
      );

      expect(jira.strictSSL).to.equal(false);
    });
  });

  describe('makeRequestHeader Tests', () => {
    it('makeRequestHeader functions properly in the average case', () => {
      const jira = new JiraApi(getOptions());

      expect(jira.makeRequestHeader(jira.makeUri({
        pathname: '/somePathName',
      }))).to.eql({
        json: true,
        method: 'GET',
        rejectUnauthorized: true,
        uri: 'http://jira.somehost.com:8080/rest/api/2.0/somePathName',
      });
    });

    it('makeRequestHeader functions properly with a different method', () => {
      const jira = new JiraApi(getOptions());

      expect(jira.makeRequestHeader(jira.makeUri({
        pathname: '/somePathName',
      }), { method: 'POST' })).to.eql({
        json: true,
        method: 'POST',
        rejectUnauthorized: true,
        uri: 'http://jira.somehost.com:8080/rest/api/2.0/somePathName',
      });
    });
  });

  describe('makeUri', () => {
    it('builds url with pathname and default host, protocol, port, and base api', () => {
      const jira = new JiraApi(getOptions());

      expect(jira.makeUri({ pathname: '/somePathName' }))
        .to.eql('http://jira.somehost.com:8080/rest/api/2.0/somePathName');
    });

    it('builds url with intermediatePath', () => {
      const jira = new JiraApi(getOptions());

      expect(jira.makeUri({ pathname: '/somePathName', intermediatePath: 'intermediatePath' }))
        .to.eql('http://jira.somehost.com:8080/intermediatePath/somePathName');
    });

    it('builds url with globally specified intermediatePath', () => {
      const jira = new JiraApi(getOptions({
        intermediatePath: 'intermediatePath',
      }));

      expect(jira.makeUri({ pathname: '/somePathName' }))
        .to.eql('http://jira.somehost.com:8080/intermediatePath/somePathName');
    });

    it('builds url with query string parameters', () => {
      const jira = new JiraApi(getOptions());

      const url = jira.makeUri({
        pathname: '/path',
        query: {
          fields: [
            'one',
            'two',
          ],
          expand: 'three',
        },
      });

      url.should.eql(
        'http://jira.somehost.com:8080/rest/api/2.0/path?fields=one&fields=two&expand=three',
      );
    });

    it('makeWebhookUri functions properly in the average case', () => {
      const jira = new JiraApi(getOptions());

      expect(jira.makeWebhookUri({
        pathname: '/somePathName',
      }))
        .to.eql('http://jira.somehost.com:8080/rest/webhooks/1.0/somePathName');
    });

    it('makeWebhookUri functions with intermediate path', () => {
      const jira = new JiraApi(getOptions());

      expect(jira.makeWebhookUri({
        pathname: '/somePathName',
        intermediatePath: '/someIntermediatePath',
      }))
        .to.eql('http://jira.somehost.com:8080/someIntermediatePath/somePathName');
    });

    it('makeSprintQueryUri functions properly in the average case', () => {
      const jira = new JiraApi(getOptions());

      expect(jira.makeSprintQueryUri({
        pathname: '/somePathName',
      }))
        .to.eql('http://jira.somehost.com:8080/rest/greenhopper/1.0/somePathName');
    });

    it('makeSprintQueryUri functions properly in the average case', () => {
      const jira = new JiraApi(getOptions());

      expect(jira.makeSprintQueryUri({
        pathname: '/somePathName',
        intermediatePath: '/someIntermediatePath',
      }))
        .to.eql('http://jira.somehost.com:8080/someIntermediatePath/somePathName');
    });

    it('makeUri functions properly no port http', () => {
      const { port, ...options } = getOptions();

      expect(options.port).to.not.eql(port);

      const jira = new JiraApi(options);

      expect(jira.makeUri({
        pathname: '/somePathName',
      }))
        .to.eql('http://jira.somehost.com/rest/api/2.0/somePathName');
    });

    it('makeUri functions properly no port https', () => {
      const { port, ...options } = getOptions({ protocol: 'https' });

      expect(options.port).to.not.eql(port);

      const jira = new JiraApi(options);

      expect(jira.makeUri({
        pathname: '/somePathName',
      }))
        .to.eql('https://jira.somehost.com/rest/api/2.0/somePathName');
    });
  });

  describe('doRequest Tests', () => {
    it('doRequest functions properly in the average case', async () => {
      const dummyObject = {
        someKey: 'someValue',
      };
      async function dummyRequest() {
        return dummyObject;
      }
      const jira = new JiraApi(
        getOptions({
          request: dummyRequest,
        }),
      );

      const response = await jira.doRequest({});
      response.should.eql(dummyObject);
    });

    it('doRequest authenticates properly when specified', async () => {
      async function dummyRequest(requestOptions) {
        return requestOptions;
      }

      const username = 'someusername';
      const password = 'somepassword';

      const jira = new JiraApi(getOptions({
        username,
        password,
        request: dummyRequest,
      }));

      const result = await jira.doRequest({});
      expect(result.auth.user).to.eql(username);
      expect(result.auth.pass).to.eql(password);
    });

    it('doRequest times out with specified option', async () => {
      async function dummyRequest(requestOptions) {
        return requestOptions;
      }

      const jira = new JiraApi({
        timeout: 2,
        ...getOptions({ request: dummyRequest }),
      });

      const result = await jira.doRequest({});
      expect(result.timeout).to.eql(2);
    });

    it('doRequest throws an error properly', async () => {
      const dummyObject = {
        errorMessages: ['some error to throw'],
      };
      async function dummyRequest() {
        return dummyObject;
      }

      const jira = new JiraApi(
        getOptions({
          request: dummyRequest,
        }),
      );

      await jira.doRequest({})
        .should.eventually.be.rejectedWith('some error to throw');
    });

    it('doRequest throws a list of errors properly', async () => {
      const dummyObject = {
        errorMessages: [
          'some error to throw',
          'another error',
        ],
      };
      async function dummyRequest() {
        return dummyObject;
      }

      const jira = new JiraApi(
        getOptions({
          request: dummyRequest,
        }),
      );

      await jira.doRequest({})
        .should.eventually.be.rejectedWith('some error to throw, another error');
    });

    it('doRequest does not throw an error on empty response', (done) => {
      function dummyRequest() {
        return Promise.resolve(undefined);
      }
      const jira = new JiraApi(
        getOptions({
          request: dummyRequest,
        }),
      );

      jira.doRequest({})
        .should.eventually.be.fulfilled
        .and.notify(done);
    });
  });

  describe('Request Functions Tests', () => {
    async function dummyURLCall(jiraApiMethodName, functionArguments, dummyRequestMethod) {
      let dummyRequest = dummyRequestMethod;
      if (!dummyRequest) {
        dummyRequest = async requestOptions => requestOptions;
      }

      const jira = new JiraApi(
        getOptions({
          request: dummyRequest,
        }),
      );

      const resultObject = await jira[jiraApiMethodName].apply(jira, functionArguments);

      // hack exposing the qs object as the query string in the URL so this is
      // uniformly testable
      if (resultObject.qs) {
        const queryString = Object.keys(resultObject.qs).map(x => `${x}=${resultObject.qs[x]}`)
        .join('&');
        return `${resultObject.uri}?${queryString}`;
      }

      return resultObject.uri;
    }

    it('findIssue hits proper url', async () => {
      const result = await dummyURLCall('findIssue', ['PK-100']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/PK-100?expand=');
    });

    it('findIssue hits proper url with expansion', async () => {
      const result = await dummyURLCall('findIssue', ['PK-100', 'transitions,changelog']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/PK-100?expand=transitions,changelog');
    });

    it('getUnresolvedIssueCount hits proper url', async () => {
      async function dummyRequest(requestOptions) {
        return { issuesUnresolvedCount: requestOptions };
      }

      const result = await dummyURLCall('getUnresolvedIssueCount', ['someVersion'], dummyRequest);
      result.should
        .eql('http://jira.somehost.com:8080/rest/api/2.0/version/someVersion/unresolvedIssueCount');
    });

    it('getProject hits proper url', async () => {
      const result = await dummyURLCall('getProject', ['someProject']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/project/someProject');
    });

    it('createProject hits proper url', async () => {
      const result = await dummyURLCall('createProject', ['dummyObject']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/project/');
    });

    it('findRapidView hits proper url', async () => {
      async function dummyRequest(requestOptions) {
        return {
          views: [{
            ...requestOptions,
            name: 'theNameToLookFor',
          }],
        };
      }

      const result = await dummyURLCall('findRapidView', ['theNameToLookFor'], dummyRequest);
      result.should.eql('http://jira.somehost.com:8080/rest/greenhopper/1.0/rapidviews/list');
    });

    it('getLastSprintForRapidView hits proper url', async () => {
      async function dummyRequest(requestOptions) {
        return {
          sprints: [requestOptions],
        };
      }

      const result = await dummyURLCall(
        'getLastSprintForRapidView',
        ['someRapidViewId'],
        dummyRequest);

      result.should.eql(
        'http://jira.somehost.com:8080/rest/greenhopper/1.0/sprintquery/someRapidViewId',
      );
    });

    it('getSprintIssues hits proper url', async () => {
      const result = await dummyURLCall('getSprintIssues', ['someRapidView', 'someSprintId']);
      result.should
        .eql('http://jira.somehost.com:8080/rest/greenhopper/1.0/rapid/charts/sprintreport?rapidViewId=someRapidView&sprintId=someSprintId');
    });

    it('listSprints hits proper url', async () => {
      const result = await dummyURLCall('listSprints', ['someRapidViewId']);
      result.should.eql(
        'http://jira.somehost.com:8080/rest/greenhopper/1.0/sprintquery/someRapidViewId',
      );
    });

    it('addIssueToSprint hits proper url', async () => {
      const result = await dummyURLCall('addIssueToSprint', ['someIssueId', 'someSprintId']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/sprint/someSprintId/issues/add');
    });

    it('issueLink hits proper url', async () => {
      const result = await dummyURLCall('issueLink', ['somelink']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issueLink');
    });

    it('getRemoteLinks hits proper url', async () => {
      const result = await dummyURLCall('getRemoteLinks', ['someIssueId']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueId/remotelink');
    });

    it('createRemoteLink hits proper url', async () => {
      const result = await dummyURLCall('createRemoteLink', ['issueNumber', 'someRemoteLink']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/issueNumber/remotelink');
    });

    it('getVersions hits proper url', async () => {
      const result = await dummyURLCall('getVersions', ['someProject']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/project/someProject/versions');
    });

    it('createVersion hits proper url', async () => {
      const result = await dummyURLCall('createVersion', ['someVersion']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/version');
    });

    it('updateVersion hits proper url', async () => {
      const result = await dummyURLCall('updateVersion', [{ id: 'someVersionId' }]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/version/someVersionId');
    });

    it('deleteVersion hits proper url', async () => {
      const result = await dummyURLCall('deleteVersion', [
        'someVersionId',
        'someFixVersionId',
        'someAffectedVersionId',
      ]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/version/someVersionId?moveFixIssuesTo=someFixVersionId&moveAffectedIssuesTo=someAffectedVersionId');
    });

    it('seachJira hits proper url', async () => {
      const result = await dummyURLCall('searchJira', ['someJQLhere', 'someOptionsObject']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/search');
    });

    it('createUser hits proper url', async () => {
      const result = await dummyURLCall('createUser', [{
        name: 'someUsername',
        emailAddress: 'someEmail',
        displayName: 'Some Name',
      }]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/user');
    });

    it('searchUsers hits proper url', async () => {
      const result = await dummyURLCall('searchUsers', [{
        username: 'someUserName',
      }]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/user/search?username=someUserName&startAt=0&maxResults=50&includeActive=true&includeInactive=false');
    });

    it('getUsersInGroup hits proper url', async () => {
      const result = await dummyURLCall('getUsersInGroup', ['someGroupName']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/group?groupname=someGroupName&expand=users[0:50]');
    });

    it('getUsersIssues hits proper url', async () => {
      const result = await dummyURLCall('getUsersIssues', ['someUsername', true]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/search');
    });

    it('addNewIssue hits proper url', async () => {
      const result = await dummyURLCall('addNewIssue', ['someIssue']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue');
    });

    it('getUsersIssues hits proper url', async () => {
      const result = await dummyURLCall('getUsersIssues', ['someUsername', 'true']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/search');
    });

    it('addWatcher hits proper url', async () => {
      const result = await dummyURLCall('addWatcher', ['ZQ-9001']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/ZQ-9001/watchers');
    });

    it('deleteIssue hits proper url', async () => {
      const result = await dummyURLCall('deleteIssue', ['FU-69']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/FU-69');
    });

    it('updateIssue hits proper url', async () => {
      const result = await dummyURLCall('updateIssue', ['MI-6', 'someInfo']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/MI-6');
    });

    it('listComponents hits proper url', async () => {
      const result = await dummyURLCall('listComponents', ['ProjectName']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/project/ProjectName/components');
    });

    it('addNewComponent hits proper url', async () => {
      const result = await dummyURLCall('addNewComponent', ['someComponent']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/component');
    });

    it('deleteComponent hits proper url', async () => {
      const result = await dummyURLCall('deleteComponent', ['someComponentNumber']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/component/someComponentNumber');
    });

    // Field APIs Suite Tests
    describe('Field APIs Suite Tests', () => {
      it('createCustomField hits proper url', async () => {
        const result = await dummyURLCall('createCustomField', ['someField']);
        result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/field');
      });

      it('listFields hits proper url', async () => {
        const result = await dummyURLCall('listFields', []);
        result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/field');
      });
    });

    // Field Option APIs Suite Tests
    describe('Field Option APIs Suite Tests', () => {
      it('createFieldOption hits proper url', async () => {
        const result = await dummyURLCall('createFieldOption', ['someFieldKey', 'someOption']);
        result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/field/someFieldKey/option');
      });

      it('listFieldOptions hits proper url', async () => {
        const result = await dummyURLCall('listFieldOptions', ['someFieldKey']);
        result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/field/someFieldKey/option');
      });

      it('upsertFieldOption hits proper url', async () => {
        const result = await dummyURLCall('upsertFieldOption', ['someFieldKey', 'someOptionId', 'someOption']);
        result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/field/someFieldKey/option/someOptionId');
      });

      it('getFieldOption hits proper url', async () => {
        const result = await dummyURLCall('getFieldOption', ['someFieldKey', 'someOptionId']);
        result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/field/someFieldKey/option/someOptionId');
      });

      it('deleteFieldOption hits proper url', async () => {
        const result = await dummyURLCall('deleteFieldOption', ['someFieldKey', 'someOptionId']);
        result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/field/someFieldKey/option/someOptionId');
      });
    });

    it('listPriorities hits proper url', async () => {
      const result = await dummyURLCall('listPriorities', []);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/priority');
    });

    it('listTransitions hits proper url', async () => {
      const result = await dummyURLCall('listTransitions', ['someIssueNumber']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/transitions?expand=transitions.fields');
    });

    it('transitionIssue hits proper url', async () => {
      const result = await dummyURLCall('transitionIssue', [
        'someIssueNumber',
        'someTransitionObject',
      ]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/transitions');
    });

    it('listProjects hits proper url', async () => {
      const result = await dummyURLCall('listProjects', []);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/project');
    });

    it('addComment hits proper url', async () => {
      const result = await dummyURLCall('addComment', ['someIssueNumber', 'someComment']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/comment');
    });

    it('updateComment hits proper url', async () => {
      const result = await dummyURLCall('updateComment', ['someIssueNumber', 'someCommentNumber', 'someComment']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/comment/someCommentNumber');
    });

    it('addWorklog hits proper url', async () => {
      const result = await dummyURLCall('addWorklog', [
        'someIssueNumber',
        'someWorkLog',
        'someNewEstimate',
      ]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/worklog?adjustEstimate=new&newEstimate=someNewEstimate');
    });

    it('deleteWorklog hits proper url', async () => {
      const result = await dummyURLCall('deleteWorklog', ['someIssueNumber', 'someWorklogId']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/worklog/someWorklogId');
    });

    it('listIssueTypes hits proper url', async () => {
      const result = await dummyURLCall('listIssueTypes', []);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issuetype');
    });

    it('registerWebhook hits proper url', async () => {
      const result = await dummyURLCall('registerWebhook', ['someWebhook']);
      result.should.eql('http://jira.somehost.com:8080/rest/webhooks/1.0/webhook');
    });

    it('listWebhooks hits proper url', async () => {
      const result = await dummyURLCall('listWebhooks', []);
      result.should.eql('http://jira.somehost.com:8080/rest/webhooks/1.0/webhook');
    });

    it('getWebhook hits proper url', async () => {
      const result = await dummyURLCall('getWebhook', ['someWebhookId']);
      result.should.eql('http://jira.somehost.com:8080/rest/webhooks/1.0/webhook/someWebhookId');
    });

    it('deleteWebhook hits proper url', async () => {
      const result = await dummyURLCall('deleteWebhook', ['someWebhookId']);
      result.should.eql('http://jira.somehost.com:8080/rest/webhooks/1.0/webhook/someWebhookId');
    });

    it('getCurrentUser hits proper url', async () => {
      const result = await dummyURLCall('getCurrentUser', []);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/myself');
    });

    it('getBacklogForRapidView hits proper url', async () => {
      const result = await dummyURLCall('getBacklogForRapidView', ['someRapidViewId']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/xboard/plan/backlog/data?rapidViewId=someRapidViewId');
    });

    it('addAttachmentOnIssue hits proper url', async () => {
      const result = await dummyURLCall('addAttachmentOnIssue', ['someIssueId', {}]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueId/attachments');
    });

    it('addAttachmentOnIssue hits proper url', async () => {
      const result = await dummyURLCall('listStatus');
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/status');
    });

    // Field Option APIs Suite Tests
    describe('Dev-Status APIs Suite Tests', () => {
      it('getDevStatusSummary hits proper url', async () => {
        const result = await dummyURLCall('getDevStatusSummary', ['someIssueId']);
        result.should.eql('http://jira.somehost.com:8080/rest/dev-status/latest/issue/summary?issueId=someIssueId');
      });

      it('getDevStatusDetail hits proper url - repo', async () => {
        const result = await dummyURLCall('getDevStatusDetail', ['someIssueId', 'someApplicationType', 'repository']);
        result.should.eql('http://jira.somehost.com:8080/rest/dev-status/latest/issue/detail?issueId=someIssueId&applicationType=someApplicationType&dataType=repository');
      });

      it('getDevStatusDetail hits proper url - pullrequest', async () => {
        const result = await dummyURLCall('getDevStatusDetail', ['someIssueId', 'someApplicationType', 'pullrequest']);
        result.should.eql('http://jira.somehost.com:8080/rest/dev-status/latest/issue/detail?issueId=someIssueId&applicationType=someApplicationType&dataType=pullrequest');
      });
    });
  });
});
