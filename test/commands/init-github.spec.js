describe("init-gulp", function(){
  var subject = require('../../commands/init-github'),
      nock = require('nock');
      // mRapido,
      // server,
      // expectedDependencies,
      // expectedUrl,
      // expectedOrg,
      // expectedToken,
      // expectedConfig = {
      //   depenencies: expectedDependencies,
      //   github: {
      //     url: expectedUrl,
      //     org: expectedOrg,
      //     token: expectedToken
      //   }
      // };

  beforeEach(function(){
    // mRapido = sinon.mock();
    // server = sinon.stub(require('restify'), 'createJsonClient');
  });

  afterEach(function(){
    // server.restore();
    // mRapido.restore();
  });

  // describe("#run()", function(){
  //   it("should init github", function(){
  //     var postAuth = nock('https://api.github.com')
  //       .post('/authorizations', '*')
  //       .reply(201, {token: 'mytoken'});
  //     var getRepos = nock('https://api.github.com')
  //       .get('/orgs/*/repos')
  //       .reply(200, [
  //         {name: 'repo1', description: 'my repo', ssh_url: 'git@github.com/myorg/repo1.git'}
  //       ]);
  //
  //     var args = {
  //       org: 'myorg',
  //
  //     }
  //
  //   });
  // });

  describe('#_updateConfig', function(){
    it("should update config", function(){
      
    });
  });

  describe("#_getToken()", function(){
    it("should create new user token", function(){
      var options = {
        org: 'myorg'
      };
      var stubClient = {
        post: sinon.stub().yields(undefined, {}, {}, {token: 'mytoken'})
      };
      return subject._getToken(options, stubClient).should.eventually.equal('mytoken');

    });

    it("should throw err", function(){
      var options = {
        org: 'myorg'
      };
      var stubClient = {
        post: sinon.stub().yields({error: 'thrown error'}, {}, {}, {token: 'mytoken'})
      };
      return subject._getToken(options, stubClient).should.be.rejected;

    });

    it('should return provided token', function() {
      var options = {
        org: 'myorg',
        token: 'mytoken'
      };
      var promise = subject._getToken(options, undefined);
      return promise.should.eventually.equal('mytoken');
    });
  });
});
