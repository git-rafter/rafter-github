var restify = require('restify');
var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');

module.exports = (function(){
  return new InitGithubCommand();
})();

module.exports.InitGithubCommand = InitGithubCommand;

function InitGithubCommand(){
  this.usage = 'Usage: $0 init github';
  this.options = {
    'org': {
      describe: 'Organization',
      alias: 'o'
    },
    'auth-token': {
      description: 'Personal OAuth Token',
      alias: 't'
    },
    'url': {
      description: "Url for github's API",
      alias: 'u'
    },
    'yes': {
      description: 'Accept default values',
      alias: 'y'
    }
  };

}

InitGithubCommand.GITHUB_URL = 'https://api.github.com';

InitGithubCommand.prototype.validate = function(args, rapido) {
  return {
    org: args.org,
    url: args.url,
    token: args.token
  };
};

InitGithubCommand.prototype.run = function(args, config, rapido) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var promptProps = self._createPrompt(args);

    return self._getOptions(promptProps, args, rapido).then(function(options) {
      var httpOptions = {
        url: options.url
      };
      if (options.token) {
        httpOptions.headers = {
          "Authorization": "token " + options.token
        };
      }
      var client = restify.createJsonClient(httpOptions);

      return Promise.all([options, self._getOrgRepos(client, options.org)]);
    })
    .then(function(argv){
      var options = argv[0];
      var dependencies = argv[1];
      return self._updateConfig(options, dependencies, rapido);
    })
    .then(function(){
      resolve();
    })
    .catch(function(err) {
      rapido.log.error(err);
      reject(err);
    });
  });
};

InitGithubCommand.prototype._updateConfig = function(options, dependencies, rapido){
  return new Promise(function(resolve, reject){
    rapido.updateConfig({
      dependencies: dependencies,
      github: {
        url: options.url,
        org: options.org,
        token: options.token
      }
    });

    if (dependencies.length > 0) {
      rapido.log.success('Successfully loaded ' + _.map(dependencies, 'name').join(', '));
    } else {
      rapido.log.info('No repositories found');
    }
    resolve(undefined);
  });
};

InitGithubCommand.prototype._getOrgRepos = function(client, org){
  return new Promise(function(resolve, reject){
    client.get(path.join('/orgs', org, 'repos'), function(err, req, res, projects) {
      if (err) return reject(err);

      var dependencies = [];
      if(projects.constructor !== Array){
        return reject(new Error('unexpected data response from github: ' + projects));
      }
      projects.forEach(function(repo) {
        var git_url;
        for (var key in repo) {
          if (repo[key] && repo[key].constructor === String && repo[key].match(/git@.*:.*.git/i)) {
            git_url = repo[key];
            break;
          }
        }

        var name = repo.name.replace(' ', '_');
        var description = repo.description;
        dependencies.push({
          name: name,
          description: description,
          url: git_url
        });
      });

      resolve(dependencies);
    });
  });
};

InitGithubCommand.prototype._getOptions = function(properties, args, rapido) {
  var self = this;
  return new Promise(function(resolve, reject) {
    if (!_.isEmpty(properties) && !(args.yes && args.token)) {
      var prompt = rapido.prompt;
      prompt.start();
      var promptGet = Promise.promisify(prompt.get);
      promptGet(properties).then(function(result) {
        args.url = args.url || result.url || InitGithubCommand.GITHUB_URL;
        args.org = args.org || result.org;
        var client;
        if(result.username && result.password && !args.token) {
          client = restify.createJsonClient({
            url: args.url,
            headers: {
              'auth': result.username + ':' + result.password
            }
          });
        }
        return self._getToken(args, client);
      })
      .then(function(token) {
        args.token = token;
        resolve(args);
      })
      .catch(function(err) {
        reject(err);
      });
    } else {
      args.url = args.url || InitGithubCommand.GITHUB_URL;
      resolve(args);
    }
  });
};

InitGithubCommand.prototype._getToken = function(args, client) {
  return new Promise(function(resolve, reject) {
    if (client) {
      var note = "rafter";
      note = (args.org ? note + "-" + args.org : note);
      client.post('/authorizations', {
        scopes: ["repo"],
        note: note
      }, function(err, req, res, obj) {
        if (err) return reject(err);
        resolve(obj.token);
      });
    } else {
      resolve(args.token);
    }
  });
};

InitGithubCommand.prototype._createPrompt = function(args) {
  var promptProps = {
    properties: {}
  };

  if (!args.url) {
    promptProps.properties.url = {
      description: 'Github API Url',
      required: false,
      default: InitGithubCommand.GITHUB_URL
    };
  }

  if (!args.org) {
    promptProps.properties.org = {
      description: 'Github Org',
      required: false
    };
  }

  if (!args.token) {
    promptProps.properties.username = {
      description: 'Github Username',
      required: false
    };

    promptProps.properties.password = {
      description: 'Github Password',
      required: false,
      hidden: true
    };
  }

  return promptProps;
};
