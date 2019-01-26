var expect = require('chai').expect
  , path = require('path')
  , find = require('../../lib')
  , base = 'test/fixtures/mock';

describe('fs-find:', function() {

  it('should use absolute path for key', function(done) {
    var opts = {absolute: true, dedupe: true};
    // NOTE: trigger dedupe code path with overlapping paths
    find([base, base], opts, function(err, files) {
      if(err) {
        return done(err);
      }
      var map = find.map(files)
        , pth = path.join(process.cwd(), base);
      expect(map[pth + '/mock.txt']).to.be.an('object');
      expect(map[pth + '/empty.txt']).to.be.an('object');
      expect(map[pth + '/deep/alt.txt']).to.be.an('object');
      expect(map[pth + '/deep/alt-file.txt']).to.be.an('object');
      done();
    })
  });

});
