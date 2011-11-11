var http = require('http'),
    url = require('url'),
    request = require('request');

var jira = function(protocol, host, port, username, password, apiVersion) {
    this.protocol = protocol;
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
    this.apiVersion = apiVersion;

    this.cookies = [];
};

jira.prototype.login = function(callback) {
    console.log("Attempting to log in to JIRA");

    var options = {
        uri: url.format({
            protocol:  this.protocol,
            host: this.host,
            port: this.port,
            pathname: 'rest/auth/1/session'
        }),
        method: 'POST',
        json: true,
        body: {
            'username': this.username,
            'password': this.password
        }
    };

    var self = this;
    request(options, function(error, response, body) {
        if (response.statusCode === 401) {
            callback('Failed to log in to JIRA due to authentication error.');
            return;
        }

        if (response.statusCode !== 200) {
            callback(response.statusCode + ': Unable to connect to JIRA during login.');
            return;
        }

        self.cookies = [];
        if (response.headers['set-cookie']) {
            self.cookies = response.headers['set-cookie'];
        }

        console.log("Logged in to JIRA successfully.");
        callback(null);
    });
};

jira.prototype.findIssueStatus = function(issueNumber, callback) {
    var self = this;
    this.login(function() {
        var options = {
            uri: url.format({
                protocol: self.protocol,
                host: self.host,
                port: self.port,
                pathname: 'rest/api/' + self.apiVersion + '/issue/' + issueNumber
            }),
            method: 'GET',
            headers: {
                Cookie: self.cookies.join(';')
            }
        };

        request(options, function(error, response, body) {
            if (response.statusCode === 404) {
                callback('Invalid issue number.');
                return;
            }

            if (response.statusCode !== 200) {
                callback(response.statusCode + ': Unable to connect to JIRA during findIssueStatus.');
                return;
            }

            body = JSON.parse(body);
            status = body.fields.status.value.name;

            callback(null, status);

        });
    });
};

jira.prototype.getUnresolvedIssueCount = function(version, callback) {
    var self = this;
    this.login(function() {
        var options = {
            uri: url.format({
                protocol: self.protocol,
                host: self.host,
                port: self.port,
                pathname: 'rest/api/' + self.apiVersion + '/version/' + version + '/unresolvedIssueCount'
            }),
            method: 'GET',
            headers: {
                Cookie: self.cookies.join(';')
            }
        };
    
        request(options, function(error, response, body) {
            if (response.statusCode === 404) {
                callback('Invalid version.');
                return;
            }

            if (response.statusCode !== 200) {
                callback(response.statusCode + ': Unable to connect to JIRA during findIssueStatus.');
                return;
            }

            body = JSON.parse(body);
            callback(null, body.issuesUnresolvedCount);
        });
    });
};

jira.prototype.getProject = function(project, callback) {
    var self = this;
    this.login(function() {
        var options = {
            uri: url.format({
                protocol: self.protocol,
                host: self.host,
                port: self.port,
                pathname: 'rest/api/' + self.apiVersion + '/project/' + project
            }),
            method: 'GET',
            headers: {
                Cookie: self.cookies.join(';')
            }
        };

        request(options, function(error, response, body) {
            if (response.statusCode === 404) {
                callback('Invalid project.');
                return;
            }

            if (response.statusCode !== 200) {
                callback(response.statusCode + ': Unable to connect to JIRA during getProject.');
                return;
            }

            body = JSON.parse(body);
            callback(null, body);
        });
    });
};

/**
 * Creates an issue link between two issues. Link should follow the below format:
 *
 * {
 *   'linkType': 'Duplicate',
 *   'fromIssueKey': 'HSP-1',
 *   'toIssueKey': 'MKY-1',
 *   'comment': {
 *     'body': 'Linked related issue!',
 *     'visibility': {
 *       'type': 'GROUP',
 *       'value': 'jira-users'
 *     }
 *   }
 * }
 *
 * @param link
 * @param errorCallback
 * @param successCallback
 */
jira.prototype.issueLink = function(link, callback) {
    var self = this;
    this.login(function() {
        var options = {
            uri: url.format({
                protocol: self.protocol,
                host: self.host,
                port: self.port,
                pathname: 'rest/api/' + self.apiVersion + '/issueLink'
            }),
            method: 'POST',
            headers: {
                Cookie: self.cookies.join(';')
            },
            json: true,
            body: link
        };

        request(options, function(error, response, body) {
            if (response.statusCode === 404) {
                callback('Invalid project.');
                return;
            }

            if (response.statusCode !== 200) {
                callback(response.statusCode + ': Unable to connect to JIRA during issueLink.');
                return;
            }

            callback(null);
        });
    });
};

exports.jira = function(protocol, host, port, username, password, apiVersion) {
    return new jira(protocol, host, port, username, password, apiVersion);
};