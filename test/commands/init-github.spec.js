var restify = require('restify');

describe("init-github", function(){
  var subject = require('../../commands/init-github'),
      nock = require('nock');

  beforeEach(function(){
    this.sinon = sinon.sandbox.create();
  });

  afterEach(function(){
    this.sinon.restore();
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

  describe('#_updateConfig()', function(){
    var sRapido;
    beforeEach(function(){
      sRapido = {
        updateConfig: this.sinon.spy(),
        log: {
          success: this.sinon.spy(),
          info: this.sinon.spy()
        }
      };
    });

    it("should update config", function(done){
      var options = {
        url: 'myurl',
        org: 'myorg',
        token: 'mytoken'
      };
      var dependencies = [{
        url: 'giturl'
      }];

      return subject._updateConfig(options, dependencies, sRapido).then(function(){
        sRapido.updateConfig.should.have.been.calledOnce;
        sRapido.log.success.should.have.been.calledOnce;
        done();
      });
    });

    it("should update config with no repositories", function(done){
      var options = {
        url: 'myurl',
        org: 'myorg',
        token: 'mytoken'
      };
      var dependencies = [];

      return subject._updateConfig(options, dependencies, sRapido).then(function(){
        sRapido.updateConfig.should.have.been.calledOnce;
        sRapido.log.info.should.have.been.calledOnce;
        done();
      });
    });
  });

  describe('#_getOrgsRepos()', function(){
    var sClient;
    beforeEach(function(){
      sClient = {
        get: this.sinon.stub()
      };
    });

    it('should get org repos', function(){
      var projects = [
        {ssh_url: 'git@example.com:myorg/repo.git', description: 'my repo description', name: 'My Repo'}
      ];

      sClient.get.yields(undefined, undefined, undefined, projects);
      return subject._getOrgRepos(sClient, 'myorg').then(function(dependencies){
        expect(dependencies).to.exist;
        dependencies.should.have.lengthOf(1);
        expect(dependencies[0]).to.have.property('url', 'git@example.com:myorg/repo.git');
      });
    });

    it('should throw InternalServerError', function(){
      var projects = [
        {ssh_url: 'git@example.com:myorg/repo.git', description: 'my repo description', name: 'My Repo'}
      ];

      sClient.get.yields(new restify.InternalServerError('useless error message'));
      return subject._getOrgRepos(sClient, 'myorg').should.be.rejectedWith(restify.InternalServerError);
    });

    it('should reject invalid project data', function(){
      var projects = 'invalid response';

      sClient.get.yields(undefined, undefined, undefined, projects);
      return subject._getOrgRepos(sClient, 'myorg').should.be.rejectedWith(Error);
    });
  });

  describe('#_getOptions()', function(){
    var sRapido, args, properties;
    beforeEach(function(){
      sRapido = {
        prompt: {
          start: this.sinon.spy(),
          get: this.sinon.stub()
        }
      };

      args = {
        url: 'myurl',
        org: 'myorg'
      };

      properties = {
        username: {},
        password: {}
      };

    });

    it('should resolve prompt options with url and org args', function(done){
      var promptResult = {
        username: 'username',
        password: 'password'
      };

      this.sinon.stub(subject, '_getToken').resolves('mytoken');
      sRapido.prompt.get.yields(undefined, promptResult);
      subject._getOptions(properties, args, sRapido).then(function(options){
        expect(options).to.exist;
        options.should.have.property('url', 'myurl');
        options.should.have.property('org', 'myorg');
        options.should.have.property('token', 'mytoken');
        done();
      });

    });

    it('should reject _getToken', function(){
      var promptResult = {
        username: 'username',
        password: 'password'
      };

      this.sinon.stub(subject, '_getToken').rejects('unexpected error');
      sRapido.prompt.get.yields(undefined, promptResult);
      return subject._getOptions(properties, args, sRapido).should.be.rejected;

    });
  });

  describe("#_getToken()", function(){
    it("should create new user token", function(){
      var options = {
        org: 'myorg'
      };
      var stubClient = {
        post: this.sinon.stub().yields(undefined, {}, {}, {token: 'mytoken'})
      };
      return subject._getToken(options, stubClient).should.eventually.equal('mytoken');

    });

    it("should throw err", function(){
      var options = {
        org: 'myorg'
      };
      var stubClient = {
        post: this.sinon.stub().yields({error: 'thrown error'}, {}, {}, {token: 'mytoken'})
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
