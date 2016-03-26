describe("init-gulp", function(){
  var subject = require('../../commands/init-github');

  it('#run', function(done){
    var mArgs, mConfig, mRapido;
    // TODO setup mocks
    subject.run(mArgs, mConfig, mRapido).then(function(){
      // TODO check expectations
      done();
    })
    .catch(function(err){
      //TODO check expectations
      done();
    });
  });

  it('#run with ', function(done){
    var mArgs, mConfig, mRapido;
    // TODO setup mocks
    subject.run(mArgs, mConfig, mRapido).then(function(){
      // TODO check expectations
      done();
    })
    .catch(function(err){
      //TODO check expectations
      done();
    });
  });
});
