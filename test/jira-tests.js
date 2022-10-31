import { expect } from 'chai';
import rewire from 'rewire';

const JiraApi = rewire('../src/jira');

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
    ca: actualOptions.ca || null,
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

    it('should allow the user to pass in a certificate authority', () => {
      const jira = new JiraApi(
        getOptions({
          ca: 'fakestring',
        }),
      );

      expect(jira.baseOptions.ca).to.equal('fakestring');
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
      // eslint-disable-next-line no-underscore-dangle
      const revert = JiraApi.__set__('_request', (uri, options, callback) => {
        callback(undefined, { body: 'Successful response!' });
      });

      const jira = new JiraApi(getOptions());

      const response = await jira.doRequest({});
      response.should.eql('Successful response!');

      revert();
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
      // eslint-disable-next-line no-underscore-dangle
      const revert = JiraApi.__set__('_request', (uri, options, callback) => {
        callback({
          body: JSON.stringify({
            errorMessages: ['some error to throw'],
          }),
        });
      });

      const jira = new JiraApi(getOptions());

      await jira.doRequest({})
        .should.eventually.be.rejectedWith('{"body":"{\\"errorMessages\\":[\\"some error to throw\\"]}"}');

      revert();
    });

    it('doRequest throws a list of errors properly', async () => {
      // eslint-disable-next-line no-underscore-dangle
      const revert = JiraApi.__set__('_request', (uri, options, callback) => {
        callback({
          body:
            JSON.stringify({ errorMessages: ['some error to throw', 'another error'] }),
        });
      });

      const jira = new JiraApi(getOptions());

      await jira.doRequest({})
        .should.eventually.be.rejectedWith('{"body":"{\\"errorMessages\\":[\\"some error to throw\\",\\"another error\\"]}"}');

      revert();
    });

    it('doRequest does not throw an error on empty response', async () => {
      // eslint-disable-next-line no-underscore-dangle
      const revert = JiraApi.__set__('_request', (uri, options, callback) => {
        callback(undefined, {
          body: undefined,
        });
      });

      const jira = new JiraApi(getOptions());

      const response = await jira.doRequest({});
      expect(response).to.be.undefined;

      revert();
    });

    it('doRequest throws an error when request failed', async () => {
      // eslint-disable-next-line no-underscore-dangle
      const revert = JiraApi.__set__('_request', (uri, options, callback) => {
        callback('This is an error message', undefined);
      });

      const jira = new JiraApi(getOptions());

      await jira.doRequest({})
        .should.eventually.be.rejectedWith('This is an error message');

      revert();
    });
  });

  describe('Request Functions Tests', () => {
    async function dummyURLCall(jiraApiMethodName, functionArguments, dummyRequestMethod, returnedValue = 'uri') {
      let dummyRequest = dummyRequestMethod;
      if (!dummyRequest) {
        dummyRequest = async (requestOptions) => requestOptions;
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
        const queryString = Object.keys(resultObject.qs).map((x) => `${x}=${resultObject.qs[x]}`)
          .join('&');
        return `${resultObject.uri}?${queryString}`;
      }

      return resultObject[returnedValue];
    }

    it('findIssue hits proper url', async () => {
      const result = await dummyURLCall('findIssue', ['PK-100']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/PK-100?expand=&fields=*all&properties=*all&fieldsByKeys=false');
    });

    it('findIssue hits proper url with expansion', async () => {
      const result = await dummyURLCall('findIssue', ['PK-100', 'transitions,changelog']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/PK-100?expand=transitions,changelog&fields=*all&properties=*all&fieldsByKeys=false');
    });

    it('findIssue hits proper url with fields', async () => {
      const result = await dummyURLCall('findIssue', ['PK-100', null, 'transitions,changelog']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/PK-100?expand=&fields=transitions,changelog&properties=*all&fieldsByKeys=false');
    });

    it('findIssue hits proper url with properties', async () => {
      const result = await dummyURLCall('findIssue', ['PK-100', null, null, 'transitions,changelog']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/PK-100?expand=&fields=*all&properties=transitions,changelog&fieldsByKeys=false');
    });

    it('findIssue hits proper url with fields and fieldsByKeys', async () => {
      const result = await dummyURLCall('findIssue', ['PK-100', null, 'transitions,changelog', null, true]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/PK-100?expand=&fields=transitions,changelog&properties=*all&fieldsByKeys=true');
    });

    it('downloadAttachment hits proper url with attachment id and filename', async () => {
      const result = await dummyURLCall('downloadAttachment', [{ id: '123456', filename: 'attachment.txt' }]);
      result.should.eql('http://jira.somehost.com:8080/secure/attachment/123456/attachment.txt');
    });

    it('downloadAttachment hits proper url with attachment id and filename with special characters', async () => {
      const result = await dummyURLCall('downloadAttachment', [{ id: '123456', filename: 'attachment-æøå.txt' }]);
      result.should.eql('http://jira.somehost.com:8080/secure/attachment/123456/attachment-%C3%A6%C3%B8%C3%A5.txt');
    });

    it('deleteAttachment hits proper url', async () => {
      const result = await dummyURLCall('deleteAttachment', ['123456']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/attachment/123456');
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
        dummyRequest,
      );

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
      result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/sprint/someSprintId/issue');
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

    it('getVersion hits proper url', async () => {
      const result = await dummyURLCall('getVersion', ['someVersion']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/version/someVersion');
    });

    it('getVersions hits proper url', async () => {
      const result = await dummyURLCall('getVersions', ['someProject']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/project/someProject/versions');
    });

    it('getVersions hits proper url with query', async () => {
      const result = await dummyURLCall('getVersions', ['someProject', { maxResults: 10 }]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/project/someProject/versions?maxResults=10');
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
        query: 'someOtherUserName',
        username: 'someUserName',
      }]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/user/search?username=someUserName&query=someOtherUserName&startAt=0&maxResults=50&includeActive=true&includeInactive=false');
    });

    it('getUsersInGroup hits proper url', async () => {
      const result = await dummyURLCall('getUsersInGroup', ['someGroupName']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/group?groupname=someGroupName&expand=users[0:50]');
    });

    it('getMembersOfGroup hits proper url', async () => {
      const result = await dummyURLCall('getMembersOfGroup', ['someGroupName']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/group/member?groupname=someGroupName&expand=users[0:50]&includeInactiveUsers=false');
    });

    it('getUsersIssues hits proper url', async () => {
      const result = await dummyURLCall('getUsersIssues', ['someUsername', true]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/search');
    });

    it('getUser hits proper url', async () => {
      const result = await dummyURLCall('getUser', ['some-account-Id', 'groups,applicationRoles']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/user?accountId=some-account-Id&expand=groups,applicationRoles');
    });

    it('getUsers hits proper url', async () => {
      const result = await dummyURLCall('getUsers', [0, 50]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/users?startAt=0&maxResults=50');
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

    it('addWatcher sends unquoted string in body', async () => {
      const result = await dummyURLCall('addWatcher', ['ZQ-9001', 'John Smith'], null, 'body');
      result.should.eql('John Smith');
    });

    it('getIssueChangelog hits proper url', async () => {
      const result = await dummyURLCall('getIssueChangelog', ['ZQ-9001']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/ZQ-9001/changelog?startAt=0&maxResults=50');
    });

    it('getIssueWatchers hits proper url', async () => {
      const result = await dummyURLCall('getIssueWatchers', ['ZQ-9001']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/ZQ-9001/watchers');
    });

    it('updateAssignee hits proper url', async () => {
      const result = await dummyURLCall('updateAssignee', ['ZQ-9001', 'Assignee']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/ZQ-9001/assignee');
    });

    it('updateAssigneeWithId hits proper url', async () => {
      const result = await dummyURLCall('updateAssigneeWithId', ['ZQ-9001', 'Assignee']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/ZQ-9001/assignee');
    });

    it('deleteIssue hits proper url', async () => {
      const result = await dummyURLCall('deleteIssue', ['FU-69']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/FU-69');
    });

    it('updateIssue hits proper url', async () => {
      const result = await dummyURLCall('updateIssue', ['MI-6', 'someInfo']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/MI-6');
    });

    it('properly creates query params for updateIssue', async () => {
      const result = await dummyURLCall('updateIssue', ['MI-6', 'someInfo', { notifyUsers: true }]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/MI-6?notifyUsers=true');
    });

    it('listComponents hits proper url', async () => {
      const result = await dummyURLCall('listComponents', ['ProjectName']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/project/ProjectName/components');
    });

    it('addNewComponent hits proper url', async () => {
      const result = await dummyURLCall('addNewComponent', ['someComponent']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/component');
    });

    it('updateComponent hits proper url', async () => {
      const result = await dummyURLCall('updateComponent', ['someComponentNumber', 'someComponent']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/component/someComponentNumber');
    });

    it('deleteComponent hits proper url', async () => {
      const result = await dummyURLCall('deleteComponent', ['someComponentNumber']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/component/someComponentNumber');
    });

    it('deleteComponent hits proper url', async () => {
      const result = await dummyURLCall('deleteComponent', ['someComponentNumber', 'someComponentName']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/component/someComponentNumber?moveIssuesTo=someComponentName');
    });

    it('relatedIssueCounts hits proper url', async () => {
      const result = await dummyURLCall('relatedIssueCounts', ['someComponentNumber', 'someComponentName']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/component/someComponentNumber/relatedIssueCounts');
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

    it('getIssueProperty hits proper url with expansion', async () => {
      const result = await dummyURLCall('getIssueProperty', ['PK-100', 'somePropertyKey']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/PK-100/properties/somePropertyKey');
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

    it('addCommentAdvanced hits proper url', async () => {
      const result = await dummyURLCall('addCommentAdvanced', ['someIssueNumber', 'someComment']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/comment');
    });

    it('updateComment hits proper url', async () => {
      const result = await dummyURLCall('updateComment', ['someIssueNumber', 'someCommentNumber', 'someComment']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/comment/someCommentNumber');
    });

    it('getComments hits proper url', async () => {
      const result = await dummyURLCall('getComments', ['someIssueNumber']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/comment');
    });

    it('getComment hits proper url', async () => {
      const result = await dummyURLCall('getComment', ['someIssueNumber', 'someCommentNumber']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/comment/someCommentNumber');
    });

    it('deleteComment hits proper url', async () => {
      const result = await dummyURLCall('deleteComment', ['someIssueNumber', 'someCommentNumber']);
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

    it('addWorklog hits proper url with adjustEstimate=leave', async () => {
      const result = await dummyURLCall('addWorklog', [
        'someIssueNumber',
        'someWorkLog',
        '',
        { adjustEstimate: 'leave' },
      ]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/worklog?adjustEstimate=leave');
    });

    it('deleteWorklog hits proper url', async () => {
      const result = await dummyURLCall('deleteWorklog', ['someIssueNumber', 'someWorklogId']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/worklog/someWorklogId');
    });

    it('updateWorklog hits proper url', async () => {
      const result = await dummyURLCall('updateWorklog', ['someIssueNumber', 'someWorklogId']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/worklog/someWorklogId');
    });

    it('deleteIssueLink hits proper url', async () => {
      const result = await dummyURLCall('deleteIssueLink', ['someLinkId']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issueLink/someLinkId');
    });

    it('getWorklogs hits proper url', async () => {
      const result = await dummyURLCall('getWorklogs');
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/worklog/list?expand=');
    });

    it('getIssueWorklogs hits proper url', async () => {
      const result = await dummyURLCall('getIssueWorklogs', ['someIssueNumber']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/worklog?startAt=0&maxResults=1000');
    });

    it('listIssueTypes hits proper url', async () => {
      const result = await dummyURLCall('listIssueTypes', []);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issuetype');
    });

    it('listIssueLinkTypes hits proper url', async () => {
      const result = await dummyURLCall('listIssueLinkTypes', []);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issueLinkType');
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

    // Agile APIs Suite Tests
    describe('Agile APIs Suite Tests', () => {
      it('getIssue hits proper url', async () => {
        const result = await dummyURLCall('getIssue', ['someIssueId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/issue/someIssueId?fields=&expand=');
      });

      it('getIssueEstimationForBoard hits proper url', async () => {
        const result = await dummyURLCall('getIssueEstimationForBoard', ['someIssueId', 'someBoardId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/issue/someIssueId/estimation?boardId=someBoardId');
      });

      it('estimateIssueForBoard hits proper url', async () => {
        const result = await dummyURLCall('estimateIssueForBoard', ['someIssueId', 'someBoardId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/issue/someIssueId/estimation?boardId=someBoardId');
      });

      it('rankIssues hits proper url', async () => {
        const result = await dummyURLCall('rankIssues');
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/issue/rank');
      });

      it('moveToBacklog hits proper url', async () => {
        const result = await dummyURLCall('moveToBacklog');
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/backlog/issue');
      });

      it('getAllBoards hits proper url', async () => {
        const result = await dummyURLCall('getAllBoards');
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board?startAt=0&maxResults=50&type=&name=');
      });

      it('getAllBoards hits proper url with project key provided', async () => {
        const result = await dummyURLCall('getAllBoards', [0, 50, undefined, undefined, 'someProjectKey']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board?startAt=0&maxResults=50&type=&name=&projectKeyOrId=someProjectKey');
      });

      it('createBoard hits proper url', async () => {
        const result = await dummyURLCall('createBoard');
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board');
      });

      it('getBoard hits proper url', async () => {
        const result = await dummyURLCall('getBoard', ['someBoardId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId');
      });

      it('deleteBoard hits proper url', async () => {
        const result = await dummyURLCall('deleteBoard', ['someBoardId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId');
      });

      it('getIssuesForBacklog hits proper url', async () => {
        const result = await dummyURLCall('getIssuesForBacklog', ['someBoardId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId/backlog?startAt=0&maxResults=50&jql=&validateQuery=true&fields=');
      });

      it('getConfiguration hits proper url', async () => {
        const result = await dummyURLCall('getConfiguration', ['someBoardId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId/configuration');
      });

      it('getIssuesForBoard hits proper url', async () => {
        const result = await dummyURLCall('getIssuesForBoard', ['someBoardId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId/issue?startAt=0&maxResults=50&jql=&validateQuery=true&fields=');
      });

      it('getFilter hits proper url', async () => {
        const result = await dummyURLCall('getFilter', ['someFilterId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/filter/someFilterId');
      });

      it('getEpics hits proper url', async () => {
        const result = await dummyURLCall('getEpics', ['someBoardId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId/epic?startAt=0&maxResults=50&done=');
      });

      it('getBoardIssuesForEpic hits proper url', async () => {
        const result = await dummyURLCall('getBoardIssuesForEpic', ['someBoardId', 'someEpicId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId/epic/someEpicId/issue?startAt=0&maxResults=50&jql=&validateQuery=true&fields=');
      });

      it('getProjects hits proper url', async () => {
        const result = await dummyURLCall('getProjects', ['someBoardId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId/project?startAt=0&maxResults=50');
      });

      it('getProjectsFull hits proper url', async () => {
        const result = await dummyURLCall('getProjectsFull', ['someBoardId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId/project/full');
      });

      it('getBoardPropertiesKeys hits proper url', async () => {
        const result = await dummyURLCall('getBoardPropertiesKeys', ['someBoardId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId/properties');
      });

      it('deleteBoardProperty hits proper url', async () => {
        const result = await dummyURLCall('deleteBoardProperty', ['someBoardId', 'somePropertyKey']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId/properties/somePropertyKey');
      });

      it('setBoardProperty hits proper url', async () => {
        const result = await dummyURLCall('setBoardProperty', ['someBoardId', 'somePropertyKey']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId/properties/somePropertyKey');
      });

      it('getBoardProperty hits proper url', async () => {
        const result = await dummyURLCall('getBoardProperty', ['someBoardId', 'somePropertyKey']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId/properties/somePropertyKey');
      });

      it('getAllSprints hits proper url', async () => {
        const result = await dummyURLCall('getAllSprints', ['someBoardId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId/sprint?startAt=0&maxResults=50&state=');
      });

      it('getBoardIssuesForSprint hits proper url', async () => {
        const result = await dummyURLCall('getBoardIssuesForSprint', ['someBoardId', 'someSprintId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId/sprint/someSprintId/issue?startAt=0&maxResults=50&jql=&validateQuery=true&fields=&expand=');
      });

      it('getAllVersions hits proper url', async () => {
        const result = await dummyURLCall('getAllVersions', ['someBoardId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/board/someBoardId/version?startAt=0&maxResults=50&released=');
      });

      it('getEpic hits proper url', async () => {
        const result = await dummyURLCall('getEpic', ['someEpicId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/epic/someEpicId');
      });

      it('partiallyUpdateEpic hits proper url', async () => {
        const result = await dummyURLCall('partiallyUpdateEpic', ['someEpicId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/epic/someEpicId');
      });

      it('getIssuesForEpic hits proper url', async () => {
        const result = await dummyURLCall('getIssuesForEpic', ['someEpicId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/epic/someEpicId/issue?startAt=0&maxResults=50&jql=&validateQuery=true&fields=');
      });

      it('moveIssuesToEpic hits proper url', async () => {
        const result = await dummyURLCall('moveIssuesToEpic', ['someEpicId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/epic/someEpicId/issue');
      });

      it('rankEpics hits proper url', async () => {
        const result = await dummyURLCall('rankEpics', ['someEpicId']);
        result.should.eql('http://jira.somehost.com:8080/rest/agile/1.0/epic/someEpicId/rank');
      });
    });

    it('issueNotify hits proper url', async () => {
      const result = await dummyURLCall('issueNotify', ['someIssueId', {}]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueId/notify');
    });

    it('getServerInfo hits proper url', async () => {
      const result = await dummyURLCall('getServerInfo');
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/serverInfo');
    });

    it('moveVersion hits proper url', async () => {
      const result = await dummyURLCall('moveVersion', ['myVersion']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/version/myVersion/move');
    });

    it('getIssueCreateMetadata hits proper url', async () => {
      const result = await dummyURLCall('getIssueCreateMetadata', [{ expand: 'projects.issuetypes.fields' }]);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/createmeta?expand=projects.issuetypes.fields');
    });

    it('genericGet hits proper url', async () => {
      // Test with field endpoint as a simple example
      const result = await dummyURLCall('genericGet', ['field']);
      result.should.eql('http://jira.somehost.com:8080/rest/api/2.0/field');
    });
  });
});
