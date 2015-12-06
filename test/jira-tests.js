import JiraApi from '../src/jira.js';

describe('Jira API Tests', () => {
  describe('Constructor Tests', () => {
    it('Constructor functions properly', () => {
      const jira = new JiraApi({
        protocol: 'http',
        host: 'jira.somehost.com',
        port: '8080',
        username: 'someusername',
        password: 'somepassword',
        apiVersion: '2.0',
        base: '',
        strictSSL: true
      });

      expect(jira.protocol).to.eql('http');
      expect(jira.host).to.eql('jira.somehost.com');
      expect(jira.port).to.eql('8080');
      expect(jira.username).to.eql('someusername');
      expect(jira.password).to.eql('somepassword');
      expect(jira.apiVersion).to.eql('2.0');
    });
  });

  describe('makeUri Tests', () => {
    it('makeUri functions properly in the average case', () => {
      const jira = new JiraApi({
        protocol: 'http',
        host: 'jira.somehost.com',
        port: '8080',
        username: 'someusername',
        password: 'somepassword',
        apiVersion: '2.0',
        strictSSL: true
      });

      expect(jira.makeUri('/somePathName'))
        .to.eql('http://jira.somehost.com:8080/rest/api/2.0/somePathName');
    });
  });

  describe('doRequest Tests', () => {
    it('doRequest functions properly in the average case', (done) => {
      const dummyObject = {
        body: JSON.stringify({
          someKey: 'someValue'
        })
      };
      function dummyRequest(requestOptions) {
        return Promise.resolve(dummyObject);
      }
      const jira = new JiraApi({
        protocol: 'http',
        host: 'jira.somehost.com',
        port: '8080',
        apiVersion: '2.0',
        strictSSL: true,
        request: dummyRequest
      });

      jira.doRequest({})
        .should.eventually.eql(JSON.parse(dummyObject.body))
        .and.notify(done);
    });

    it('doRequest authenticates properly when specified', (done) => {
      function dummyRequest(requestOptions) {
        return Promise.resolve({
          body: JSON.stringify(requestOptions)
        });
      }
      const jira = new JiraApi({
        protocol: 'http',
        host: 'jira.somehost.com',
        port: '8080',
        username: 'someusername',
        password: 'somepassword',
        apiVersion: '2.0',
        strictSSL: true,
        request: dummyRequest
      });

      jira.doRequest({})
        .then(resultObject => {
          expect(resultObject.auth.user).to.eql(jira.username);
          expect(resultObject.auth.pass).to.eql(jira.password);
        })
        .should.notify(done);
    });

    it('doRequest throws an error properly', (done) => {
      const dummyObject = {
        body: JSON.stringify({
          errorMessages: ['some error to throw']
        })
      };
      function dummyRequest(requestOptions) {
        return Promise.resolve(dummyObject);
      }
      const jira = new JiraApi({
        protocol: 'http',
        host: 'jira.somehost.com',
        port: '8080',
        username: 'someusername',
        password: 'somepassword',
        apiVersion: '2.0',
        strictSSL: true,
        request: dummyRequest
      });

      jira.doRequest({})
        .should.eventually.be.rejectedWith('some error to throw')
        .and.notify(done);
    });

    it('doRequest throws a list of errors properly', (done) => {
      const dummyObject = {
        body: JSON.stringify({
          errorMessages: [
            'some error to throw',
            'another error'
          ]
        })
      };
      function dummyRequest(requestOptions) {
        return Promise.resolve(dummyObject);
      }
      const jira = new JiraApi({
        protocol: 'http',
        host: 'jira.somehost.com',
        port: '8080',
        username: 'someusername',
        password: 'somepassword',
        apiVersion: '2.0',
        strictSSL: true,
        request: dummyRequest
      });

      jira.doRequest({})
        .should.eventually.be.rejectedWith('some error to throw, another error')
        .and.notify(done);
    });
  });

  describe('Request Functions Tests', () => {
    function dummyURLCall(jiraApiMethodName, functionArguments, dummyRequestMethod) {
      let dummyRequest = dummyRequestMethod;
      if (!dummyRequest) {
        dummyRequest = (requestOptions) => {
          return Promise.resolve({
            body: JSON.stringify(requestOptions)
          });
        };
      }
      const jira = new JiraApi({
        protocol: 'http',
        host: 'jira.somehost.com',
        port: '8080',
        username: 'someusername',
        password: 'somepassword',
        apiVersion: '2.0',
        strictSSL: true,
        request: dummyRequest
      });

      return jira[jiraApiMethodName].apply(jira, functionArguments)
        .then(resultObject => {
          return resultObject.uri;
        });
    }

    it('findIssue hits proper url', (done) => {
      dummyURLCall('findIssue', ['PK-100'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/PK-100')
        .and.notify(done);
    });

    it('getUnresolvedIssueCount hits proper url', (done) => {
      function dummyRequest(requestOptions) {
        return Promise.resolve({
          body: JSON.stringify({
            issuesUnresolvedCount: requestOptions
          })
        });
      }

      dummyURLCall('getUnresolvedIssueCount', ['someVersion'], dummyRequest)
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/version/someVersion/unresolvedIssueCount')
        .and.notify(done);
    });

    it('getProject hits proper url', (done) => {
      dummyURLCall('getProject', ['someProject'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/project/someProject')
        .and.notify(done);
    });

    it('findRapidView hits proper url', (done) => {
      function dummyRequest(requestOptions) {
        return Promise.resolve({
          body: JSON.stringify({
            views: [{
              ...requestOptions,
              name: 'theNameToLookFor'
            }]
          })
        });
      }

      dummyURLCall('findRapidView', ['theNameToLookFor'], dummyRequest)
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/rapidviews/list')
        .and.notify(done);
    });

    it('getLastSprintForRapidView hits proper url', (done) => {
      function dummyRequest(requestOptions) {
        return Promise.resolve({
          body: JSON.stringify({
            sprints: [requestOptions]
          })
        });
      }

      dummyURLCall('getLastSprintForRapidView', ['someRapidViewId'], dummyRequest)
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/sprintquery/someRapidViewId')
        .and.notify(done);
    });

    it('getSprintIssues hits proper url', (done) => {
      dummyURLCall('getSprintIssues', ['someRapidView', 'someSprintId'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/rapid/charts/sprintreport?rapidViewId=someRapidView&sprintId=someSprintId')
        .and.notify(done);
    });

    it('addIssueToSprint hits proper url', (done) => {
      dummyURLCall('addIssueToSprint', ['someIssueId', 'someSprintId'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/sprint/someSprintId/issues/add')
        .and.notify(done);
    });

    it('issueLink hits proper url', (done) => {
      dummyURLCall('issueLink', ['somelink'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/issueLink')
        .and.notify(done);
    });

    it('getRemoteLinks hits proper url', (done) => {
      dummyURLCall('getRemoteLinks', ['someIssueId'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueId/remotelink')
        .and.notify(done);
    });

    it('createRemoteLink hits proper url', (done) => {
      dummyURLCall('createRemoteLink', ['issueNumber', 'someRemoteLink'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/issueNumber/remotelink')
        .and.notify(done);
    });

    it('getVersions hits proper url', (done) => {
      dummyURLCall('getVersions', ['someProject'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/project/someProject/versions')
        .and.notify(done);
    });

    it('createVersion hits proper url', (done) => {
      dummyURLCall('createVersion', ['someVersion'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/version')
        .and.notify(done);
    });

    it('updateVersion hits proper url', (done) => {
      dummyURLCall('updateVersion', [{id: 'someVersionId'}])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/version/someVersionId')
        .and.notify(done);
    });

    it('seachJira hits proper url', (done) => {
      dummyURLCall('searchJira', ['someJQLhere', 'someOptionsObject'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/search')
        .and.notify(done);
    });

    it('searchUsers hits proper url', (done) => {
      dummyURLCall('searchUsers', [{
        username: 'someUserName'
      }])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/user/search?username=someUserName&startAt=0&maxResults=50&includeActive=true&includeInactive=false')
        .and.notify(done);
    });

    it('getUsersInGroup hits proper url', (done) => {
      dummyURLCall('getUsersInGroup', ['someGroupName'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/group?groupname=someGroupName&expand=users[0:50]')
        .and.notify(done);
    });

    it('getUsersIssues hits proper url', (done) => {
      dummyURLCall('getUsersIssues', ['someUsername', 'true'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/search')
        .and.notify(done);
    });

    it('addNewIssue hits proper url', (done) => {
      dummyURLCall('addNewIssue', ['someIssue'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/issue')
        .and.notify(done);
    });

    it('getUsersIssues hits proper url', (done) => {
      dummyURLCall('getUsersIssues', ['someUsername', 'true'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/search')
        .and.notify(done);
    });

    it('addWatcher hits proper url', (done) => {
      dummyURLCall('addWatcher', ['ZQ-9001'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/ZQ-9001/watchers')
        .and.notify(done);
    });

    it('deleteIssue hits proper url', (done) => {
      dummyURLCall('deleteIssue', ['FU-69'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/FU-69')
        .and.notify(done);
    });

    it('updateIssue hits proper url', (done) => {
      dummyURLCall('updateIssue', ['MI-6', 'someInfo'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/MI-6')
        .and.notify(done);
    });

    it('listComponents hits proper url', (done) => {
      dummyURLCall('listComponents', ['ProjectName'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/project/ProjectName/components')
        .and.notify(done);
    });

    it('addNewComponent hits proper url', (done) => {
      dummyURLCall('addNewComponent', ['someComponent'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/component')
        .and.notify(done);
    });

    it('deleteComponent hits proper url', (done) => {
      dummyURLCall('deleteComponent', ['someComponentNumber'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/component/someComponentNumber')
        .and.notify(done);
    });

    it('listFields hits proper url', (done) => {
      dummyURLCall('listFields', [])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/field')
        .and.notify(done);
    });

    it('listPriorities hits proper url', (done) => {
      dummyURLCall('listPriorities', [])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/priority')
        .and.notify(done);
    });

    it('listTransitions hits proper url', (done) => {
      dummyURLCall('listTransitions', ['someIssueNumber'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/transitions?expand=transitions.fields')
        .and.notify(done);
    });

    it('transitionIssue hits proper url', (done) => {
      dummyURLCall('transitionIssue', ['someIssueNumber', 'someTransitionObject'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/transitions')
        .and.notify(done);
    });

    it('listProjects hits proper url', (done) => {
      dummyURLCall('listProjects', [])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/project')
        .and.notify(done);
    });

    it('addComment hits proper url', (done) => {
      dummyURLCall('addComment', ['someIssueNumber', 'someComment'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/comment')
        .and.notify(done);
    });

    it('addWorklog hits proper url', (done) => {
      dummyURLCall('addWorklog', ['someIssueNumber', 'someWorkLog', 'someNewEstimate'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/worklog?adjustEstimate=new&newEstimate=someNewEstimate')
        .and.notify(done);
    });

    it('deleteWorklog hits proper url', (done) => {
      dummyURLCall('deleteWorklog', ['someIssueNumber', 'someWorklogId'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/issue/someIssueNumber/worklog/someWorklogId')
        .and.notify(done);
    });

    it('listIssueTypes hits proper url', (done) => {
      dummyURLCall('listIssueTypes', [])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/issuetype')
        .and.notify(done);
    });

    it('registerWebhook hits proper url', (done) => {
      dummyURLCall('registerWebhook', ['someWebhook'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/webhook')
        .and.notify(done);
    });

    it('listWebhooks hits proper url', (done) => {
      dummyURLCall('listWebhooks', [])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/webhook')
        .and.notify(done);
    });

    it('getWebhook hits proper url', (done) => {
      dummyURLCall('getWebhook', ['someWebhookId'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/webhook/someWebhookId')
        .and.notify(done);
    });

    it('deleteWebhook hits proper url', (done) => {
      dummyURLCall('deleteWebhook', ['someWebhookId'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/webhook/someWebhookId')
        .and.notify(done);
    });

    it('getCurrentUser hits proper url', (done) => {
      dummyURLCall('getCurrentUser', [])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/session')
        .and.notify(done);
    });

    it('getBacklogForRapidView hits proper url', (done) => {
      dummyURLCall('getBacklogForRapidView', ['someRapidViewId'])
        .should.eventually.eql('http://jira.somehost.com:8080/rest/api/2.0/xboard/plan/backlog/data?rapidViewId=someRapidViewId')
        .and.notify(done);
    });
  });
});
