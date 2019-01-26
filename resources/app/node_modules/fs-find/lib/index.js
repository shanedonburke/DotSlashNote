var fs  = require('fs')
  , path = require('path')
  , assert = require('assert');

/**
 *  Generic accept function.
 */
function accept(/*path, info*/) {
  return true;
}

/**
 *  Generic reject function.
 */
function reject(/*path, info*/) {
  return false;
}

function getInfo(file, base, opts) {
  opts = opts || {};
  var nm = path.basename(file)
    , matcher = opts.fullpath ? file : nm;
  base = base || process.cwd();
  var info = {
    file: file,
    name: nm,
    folder: path.dirname(file),
    matcher: matcher,
    stat: opts.stat || null
  };
  info.base = base;
  info.relative = path.relative(base, file);
  return info;
}

/**
 *  Walk target files and directories.
 */
function Walker(paths, opts, cb) {
  assert(
    Array.isArray(paths) || typeof paths === 'string',
    'walk expects file or folder path(s)');

  if(!Array.isArray(paths)) {
    paths = [paths];
  }

  //console.dir('fs-find')
  //console.dir(paths)

  if(typeof opts === 'function') {
    cb = opts;
    opts = null;
  }

  opts = opts || {};

  var root = paths
    , base = null
    , depth = 0;

  opts.filter = typeof opts.filter === 'function'
    ? opts.filter : accept;
  opts.file = typeof opts.file === 'function'
    ? opts.file : accept;
  opts.folder = typeof opts.folder === 'function'
    ? opts.folder : accept;

  // walk the file list array
  function walk(files, list, cb) {
    var i = 0;
    list = list || [];

    //console.log( 'walk %j', files)

    function check(file, cb) {
      var info = getInfo(file, base, opts);

      if(!opts.filter(file, info)) {
        return cb(null, list); 
      }

      // stat on target file being read
      var method = opts.followLinks ? fs.stat : fs.lstat;
      method.call(fs, file, function onStat(err, stats) {
        if(err) {
          return cb(err);
        }

        info.stat = stats;

        if(!/^\//.test(file) && opts.absolute) {
          file = path.normalize(path.join(opts.base || process.cwd(), file));
        }

        //if(stats.isFile() || stats.isSymbolicLink()) {
        if(stats.isDirectory()) {

          // do not descend into directory
          if(!opts.folder(file, info)) {
            //console.warn('ignored by folder function %s', file);
            return cb(null, list); 
          }else if(opts.dirs
            && (!opts.exclude || (opts.exclude && depth > 0))) {
            list.push(info);
          }

          return fs.readdir(file, function onRead(err, children) {
            /* istanbul ignore next: difficult error to mock */
            if(err) {
              return cb(err);
            }

            ++depth;

            // no children in list
            if(!children.length) {
              return cb(null, list);
            }

            // make paths absolute for children
            children = children.map(function(nm) {
              return path.join(file, nm);
            })

            if(opts.depth && depth && depth > opts.depth) {
              //console.warn('skipping entry on depth %s (%s)', depth, file)
              --depth;
              return cb(null, list);
            }

            return walk(children, list, function() {
              --depth;
              //console.log('walk complete %s', file)
              cb.apply(null, arguments);
            });
          })
        }else{
          if(opts.file(file, info)
            && (!opts.exclude
              || (opts.exclude && !~paths.indexOf(info.file)))) {
            list.push(info);
          }
          return cb(null, list);
        }
      });
    }

    if(!files[i]) {
      return cb(null, list); 
    }

    // update base path
    if(files === root) {
      base = files[i];  
    }

    check(files[i], function onCheck(err, list) {
      if(err) {
        return cb(err);
      }
      if(i === files.length - 1) {
        return cb(null, list);
      }
      i++;
      check(files[i], onCheck);
    });
  }

  walk(root, null, function onList(err, list) {
    if(err) {
      return cb(err);
    }
    var map = {}
      , arr = [];
    // best used with absolute: true
    if(opts.dedupe) {
      list.forEach(function(info) {
        if(!map[info.file]) {
          arr.push(info); 
        }
        map[info.file] = info;
      })
      list = arr;
    }
    cb(null, list);
  });
}

function map(list) {
  var o = {};
  list.forEach(function(info) {
    o[info.file] = info; 
  })
  return o;
}

function run(paths, opts,cb) {
  return new Walker(paths, opts, cb);
}

run.Walk = Walker;
run.accept = accept;
run.reject = reject;
run.map = map;
run.info = getInfo;

module.exports = run;
