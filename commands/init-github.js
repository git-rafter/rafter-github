var restify = require('restify');
var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');

var GITHUB_URL = 'https://api.github.com';

module.exports = {
  usage: 'Usage: $0 init github',

  options: {
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
  },

  validate: function(args, rapido) {

    return {
      org: args.org,
      url: args.url,
      token: args.token
    };
  },

  run: function(args, config, rapido) {
    return new Promise(function(resolve, reject) {
      var promptProps = createPrompt(args);

      promptUser(promptProps, args).then(function(options) {
        var httpOptions = {
          url: options.url
        };
        if (options.token) {
          httpOptions.headers = {
            "Authorization": options.token + " OAUTH-TOKEN"
          };
        }
        var client = restify.createJsonClient({
          url: options.url
        });
        client.get(path.join('/orgs', options.org, 'repos'), function(err, req, res, obj) {
          if (err) {
            rapido.log.error(err);
            return reject(err);
          }

          var projects = res.body;
          var dependencies = [];
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
      })
      .catch(function(err) {
        rapido.log.error(err);
        reject(err);
      });
    });
  }
};

function promptUser(properties, args) {
  return new Promise(function(resolve, reject) {
    if (!_.isEmpty(promptProps.properties) && !(args.yes && args.token)) {
      var prompt = rapido.prompt;
      prompt.start();
      var promptGet = Promise.promisify(prompt.get);
      promptGet(promptProps).then(function(result) {
          args.url = args.url || result.url || GITHUB_URL;
          args.org = args.org || result.org;
          return getToken();
        })
        .then(function(token) {
          args.token = token;
          resolve(args);
        })
        .catch(function(err) {
          reject(err);
        });
    } else {
      args.url = args.url || GITHUB_URL;
      resolve(args);
    }
  });
}

function getToken(args) {
  return new Promise(function(resolve, reject) {
    if (!args.token && result.username && result.password) {
      var client = restify.createJsonClient({
        url: args.url,
        headers: {
          'auth': result.username + ':' + result.password
        }
      });
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
}

function createPrompt(args) {
  var promptProps = {
    properties: {}
  };

  if (!args.url) {
    promptProps.properties.url = {
      description: 'Github API Url',
      required: false,
      default: GITHUB_URL
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
}
