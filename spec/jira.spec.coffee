url         = require 'url'

nodeJira    = require '../lib/jira'

describe "Node Jira Tests", ->
    makeUrl = (path) ->
        url.format
                protocol: 'http'
                hostname: 'localhost'
                auth: 'test:test'
                port: 80
                pathname: "rest/api/2/#{path}"


    beforeEach ->
        @jira = new nodeJira.JiraApi 'http', 'localhost', 80, 'test', 'test', 2
        spyOn @jira, 'request'
        @cb = jasmine.createSpy 'callback'

    it "Finds an issue", ->
        options =
            uri: makeUrl "issue/1"
            method: 'GET'
        @jira.findIssue 1, @cb
        expect(@jira.request.mostRecentCall.args[0]).toEqual options

        # Invalid issue number (different than unable to find??)
        @jira.request.mostRecentCall.args[1] null, statusCode:404, null
        expect(@cb).toHaveBeenCalledWith 'Invalid issue number.'

        # Unable to find issue
        @jira.request.mostRecentCall.args[1] null, statusCode:401, null
        expect(@cb.mostRecentCall.args[0])
            .toEqual '401: Unable to connect to JIRA during findIssueStatus.'

        # Successful Request
        @jira.request.mostRecentCall.args[1] null,
            statusCode:200, '{"body":"none"}'
        expect(@cb.mostRecentCall.args[0])
            .toEqual null
        expect(@cb.mostRecentCall.args[1])
            .toEqual body:'none'

    it "Gets the unresolved issue count", ->
        options =
            uri: makeUrl "version/1/unresolvedIssueCount"
            method: 'GET'

        @jira.getUnresolvedIssueCount 1, @cb
        expect(@jira.request.mostRecentCall.args[0]).toEqual options

        # Invalid Version
        @jira.request.mostRecentCall.args[1] null, statusCode:404, null
        expect(@cb).toHaveBeenCalledWith 'Invalid version.'

        # Unable to connect
        @jira.request.mostRecentCall.args[1] null, statusCode:401, null
        expect(@cb.mostRecentCall.args[0])
            .toEqual '401: Unable to connect to JIRA during findIssueStatus.'
        
        # Successful Request
        @jira.request.mostRecentCall.args[1] null,
            statusCode:200, '{"issuesUnresolvedCount":1}'
        expect(@cb.mostRecentCall.args[0])
            .toEqual null
        expect(@cb.mostRecentCall.args[1])
            .toEqual 1

    it "Gets the project from a key", ->
        options =
            uri: makeUrl "project/ABC"
            method: 'GET'

        @jira.getProject 'ABC', @cb
        expect(@jira.request.mostRecentCall.args[0]).toEqual options

        # Invalid Version
        @jira.request.mostRecentCall.args[1] null, statusCode:404, null
        expect(@cb).toHaveBeenCalledWith 'Invalid project.'

        # Successful Request
        @jira.request.mostRecentCall.args[1] null,
            statusCode:200, '{"body":"none"}'
        expect(@cb.mostRecentCall.args[0])
            .toEqual null
        expect(@cb.mostRecentCall.args[1])
            .toEqual body:"none"

    it "Finds a Rapid View", ->
        ## TODO

    it "Gets the last sprint for a Rapid View", ->
        ## TODO
        
    it "Adds an issue to a sprint", ->
        ## TODO

    it "Creates a Link Between two Issues", ->
        options =
            uri: makeUrl "issueLink"
            method: 'POST'
            json: true
            body: 'test'

        @jira.issueLink 'test', @cb
        expect(@jira.request.mostRecentCall.args[0]).toEqual options

        # Invalid Project
        @jira.request.mostRecentCall.args[1] null, statusCode:404, null
        expect(@cb).toHaveBeenCalledWith 'Invalid project.'

        @jira.request.mostRecentCall.args[1] null, statusCode:401, null
        expect(@cb.mostRecentCall.args[0])
            .toEqual '401: Unable to connect to JIRA during issueLink.'

        # Successful Request
        @jira.request.mostRecentCall.args[1] null, statusCode:200
        expect(@cb.mostRecentCall.args[0])
            .toEqual null

    it "Gets versions for a project", ->
        options =
            uri: makeUrl "project/ABC/versions"
            method: 'GET'

        @jira.getVersions 'ABC', @cb
        expect(@jira.request.mostRecentCall.args[0]).toEqual options

        # Invalid Project
        @jira.request.mostRecentCall.args[1] null, statusCode:404, null
        expect(@cb).toHaveBeenCalledWith 'Invalid project.'

        @jira.request.mostRecentCall.args[1] null, statusCode:401, null
        expect(@cb.mostRecentCall.args[0])
            .toEqual '401: Unable to connect to JIRA during getVersions.'

        # Successful Request
        @jira.request.mostRecentCall.args[1] null,
            statusCode:200, '{"body":"none"}'
        expect(@cb.mostRecentCall.args[0])
            .toEqual null
        expect(@cb.mostRecentCall.args[1])
            .toEqual body:'none'

    it "Creates a version for a project", ->
        options =
            uri: makeUrl "version"
            method: 'POST'
            json: true
            body: 'ABC'

        @jira.createVersion 'ABC', @cb
        expect(@jira.request.mostRecentCall.args[0]).toEqual options

        # Invalid Project
        @jira.request.mostRecentCall.args[1] null, statusCode:404, null
        expect(@cb).toHaveBeenCalledWith 'Version does not exist or the
 currently authenticated user does not have permission to view it'

        @jira.request.mostRecentCall.args[1] null, statusCode:403, null
        expect(@cb.mostRecentCall.args[0])
            .toEqual 'The currently authenticated user does not have
 permission to edit the version'

        @jira.request.mostRecentCall.args[1] null, statusCode:401, null
        expect(@cb.mostRecentCall.args[0])
            .toEqual '401: Unable to connect to JIRA during createVersion.'

        # Successful Request
        @jira.request.mostRecentCall.args[1] null,
            statusCode:201, '{"body":"none"}'
        expect(@cb.mostRecentCall.args[0])
            .toEqual null
        expect(@cb.mostRecentCall.args[1])
            .toEqual '{"body":"none"}'

    it "Passes a search query to Jira, default fields", ->
        fields = ["summary", "status", "assignee", "description"]
        options =
            uri: makeUrl "search"
            method: 'POST'
            json: true
            body:
                jql: 'aJQLstring'
                startAt: 0
                fields: fields

        @jira.searchJira 'aJQLstring', null, @cb
        expect(@jira.request.mostRecentCall.args[0]).toEqual options

        # Invalid Project
        @jira.request.mostRecentCall.args[1] null, statusCode:400, null
        expect(@cb).toHaveBeenCalledWith 'Problem with the JQL query'

        @jira.request.mostRecentCall.args[1] null, statusCode:401, null
        expect(@cb.mostRecentCall.args[0])
            .toEqual '401: Unable to connect to JIRA during search.'

        # Successful Request
        @jira.request.mostRecentCall.args[1] null,
            statusCode:200, '{"body":"none"}'
        expect(@cb.mostRecentCall.args[0])
            .toEqual null
        expect(@cb.mostRecentCall.args[1])
            .toEqual '{"body":"none"}'

    it "Passes a search query to Jira, non-default fields", ->
        fields = ["assignee", "description", "test"]
        options =
            uri: makeUrl "search"
            method: 'POST'
            json: true
            body:
                jql: 'aJQLstring'
                startAt: 0
                fields: fields

        @jira.searchJira 'aJQLstring', fields, @cb
        expect(@jira.request.mostRecentCall.args[0]).toEqual options

    it "Gets a specified User's OPEN Issues", ->
        spyOn @jira, 'searchJira'
        expected = "assignee = test AND status in (Open, \"In Progress\",
 Reopened)"
        
        @jira.getUsersIssues 'test', true, @cb
        expect(@jira.searchJira.mostRecentCall.args[0])
            .toEqual expected
        expect(@jira.searchJira.mostRecentCall.args[1])
            .toEqual null

    it "Gets ALL a specified User's Issues", ->
        spyOn @jira, 'searchJira'
        expected = "assignee = test"
        
        @jira.getUsersIssues 'test', false, @cb
        expect(@jira.searchJira.mostRecentCall.args[0])
            .toEqual expected
        expect(@jira.searchJira.mostRecentCall.args[1])
            .toEqual null

    it "Deletes an Issue", ->
        options =
            uri: makeUrl "issue/1"
            method: 'DELETE'
            json: true

        @jira.deleteIssue 1, @cb
        expect(@jira.request.mostRecentCall.args[0]).toEqual options

        @jira.request.mostRecentCall.args[1] null, statusCode:401, null
        expect(@cb.mostRecentCall.args[0])
            .toEqual '401: Error while deleting'

        # Successful Request
        @jira.request.mostRecentCall.args[1] null, statusCode:204
        expect(@cb.mostRecentCall.args[0])
            .toEqual null
        expect(@cb.mostRecentCall.args[1])
            .toEqual 'Success'

    it "Updates an Issue", ->
        options =
            uri: makeUrl "issue/1"
            body: 'updateGoesHere'
            method: 'PUT'
            json: true

        @jira.updateIssue 1, 'updateGoesHere', @cb
        expect(@jira.request.mostRecentCall.args[0]).toEqual options

        @jira.request.mostRecentCall.args[1] null, statusCode:401
        expect(@cb.mostRecentCall.args[0])
            .toEqual '401: Error while updating'

        # Successful Request
        @jira.request.mostRecentCall.args[1] null, statusCode:200
        expect(@cb.mostRecentCall.args[0])
            .toEqual null
        expect(@cb.mostRecentCall.args[1])
            .toEqual 'Success'

    it "Lists Transitions", ->
        options =
            uri: makeUrl "issue/1/transitions"
            method: 'GET'
            json: true

        @jira.listTransitions 1, @cb
        expect(@jira.request.mostRecentCall.args[0]).toEqual options

        @jira.request.mostRecentCall.args[1] null, statusCode:404, null
        expect(@cb.mostRecentCall.args[0])
            .toEqual 'Issue not found'

        @jira.request.mostRecentCall.args[1] null, statusCode:401
        expect(@cb.mostRecentCall.args[0])
            .toEqual '401: Error while updating'

        # Successful Request
        @jira.request.mostRecentCall.args[1] null, statusCode:200,
            transitions:"someTransitions"
        expect(@cb.mostRecentCall.args[0])
            .toEqual null
        expect(@cb.mostRecentCall.args[1])
            .toEqual "someTransitions"

    it "Transitions an issue", ->
        options =
            uri: makeUrl "issue/1/transitions"
            body: 'someTransition'
            method: 'POST'
            json: true

        @jira.transitionIssue 1, 'someTransition', @cb
        expect(@jira.request.mostRecentCall.args[0]).toEqual options

        @jira.request.mostRecentCall.args[1] null, statusCode:401
        expect(@cb.mostRecentCall.args[0])
            .toEqual '401: Error while updating'

        # Successful Request
        @jira.request.mostRecentCall.args[1] null, statusCode:204
        expect(@cb.mostRecentCall.args[0])
            .toEqual null
        expect(@cb.mostRecentCall.args[1])
            .toEqual "Success"

    it "Lists Projects", ->
        options =
            uri: makeUrl "project"
            method: 'GET'
            json: true

        @jira.listProjects @cb
        expect(@jira.request.mostRecentCall.args[0]).toEqual options

        @jira.request.mostRecentCall.args[1] null, statusCode:401
        expect(@cb.mostRecentCall.args[0])
            .toEqual '401: Error while updating'

        @jira.request.mostRecentCall.args[1] null, statusCode:500
        expect(@cb.mostRecentCall.args[0])
            .toEqual '500: Error while retrieving list.'

        # Successful Request
        @jira.request.mostRecentCall.args[1] null, statusCode:200, "body"
        expect(@cb.mostRecentCall.args[0])
            .toEqual null
        expect(@cb.mostRecentCall.args[1])
            .toEqual "body"

    it "Adds a worklog to a project", ->
        options =
            uri: makeUrl "issue/1/worklog"
            body: 'aWorklog'
            method: 'POST'
            json: true

        @jira.addWorklog 1, 'aWorklog', @cb
        expect(@jira.request.mostRecentCall.args[0]).toEqual options

        @jira.request.mostRecentCall.args[1] null, statusCode:400,
            '{"body:"none"}'
        expect(@cb.mostRecentCall.args[0])
            .toEqual 'Invalid Fields: "{\\"body:\\"none\\"}"'

        @jira.request.mostRecentCall.args[1] null, statusCode:403
        expect(@cb.mostRecentCall.args[0])
            .toEqual 'Insufficient Permissions'

        @jira.request.mostRecentCall.args[1] null, statusCode:401
        expect(@cb.mostRecentCall.args[0])
            .toEqual '401: Error while updating'

        # Successful Request
        @jira.request.mostRecentCall.args[1] null, statusCode:201
        expect(@cb.mostRecentCall.args[0])
            .toEqual null
        expect(@cb.mostRecentCall.args[1])
            .toEqual "Success"

    it "Adds a worklog to a project", ->
        options =
            uri: makeUrl "issuetype"
            method: 'GET'
            json: true

        @jira.listIssueTypes @cb
        expect(@jira.request.mostRecentCall.args[0]).toEqual options

        @jira.request.mostRecentCall.args[1] null, statusCode:401
        expect(@cb.mostRecentCall.args[0])
            .toEqual '401: Error while retreiving issue types'

        # Successful Request
        @jira.request.mostRecentCall.args[1] null, statusCode:200, "body"
        expect(@cb.mostRecentCall.args[0])
            .toEqual null
        expect(@cb.mostRecentCall.args[1])
            .toEqual "body"
