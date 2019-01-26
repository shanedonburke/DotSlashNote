var expect = require('chai').expect
  , find = require('../../lib');

describe('fs-find:', function() {

  it('should get file info object', function(done) {
    var info = find.info('mock.txt');
    expect(info.name).to.eql('mock.txt');
    expect(info.base).to.eql(process.cwd());
    done();
  });

});
