var expect = require('chai').expect
  , find = require('../../lib');

describe('fs-find:', function() {

  it('should error on bad symlink w/ followLinks', function(done) {
    var paths = ['test/fixtures/bad-symlink']
      , opts = {followLinks: true};
    find(paths, opts, function(err/*, files*/) {
      function fn() {
        throw err;
      }
      expect(fn).throws(Error);
      expect(fn).throws(/ENOENT/);
      expect(fn).throws(/stat/);
      expect(fn).throws(/symlink.txt/);
      done();
    })
  });

});
