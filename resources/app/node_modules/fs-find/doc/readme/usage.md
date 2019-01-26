## Usage

```javascript
find(path, [opts], cb)
```

```javascript
var find = require('fs-find')
  , path = process.cwd();
find(path, function(err, results) {
  if(err) {
    return console.error(err);
  }
  console.dir(results);
}
```

### Arguments

* `path`: String or array of strings referencing directories and/or files.
* `opts`: Processing options, see below.
* `cb`: Callback function with signature `function(err, results)` where results 
    is an array of `info` objects.

### Options

* `dirs`: Include directories in results array (default: `false`).
* `exclude`: Do not include the `path` argument values in the `results`.
* `filter`: Generic filter function before `stat` is called.
* `file`: Filter function for files.
* `folder`: Filter function for directories.
* `fullpath`: Use full file path for matching.
* `followLinks`: Follow symbolic links (`stat` rather than `lstat`).
* `depth`: Maximum folder depth to recurse.
* `absolute`: Make all file paths absolute.
* `dedupe`: Remove duplicate entries, possible if the `path` array contains 
    overlapping folders, best used with `absolute` enabled.

### Filter

Filter functions have the signature `function filter(path, info)` and should 
return a `boolean`. The `info` object may be modified in place and will be 
included in the results array.

### Info

The `info` object contains the fields:

* `file`: The full file path.
* `name`: The basename of the file.
* `folder`: The parent folder.
* `matcher`: Either the file path or name depending upon the `fullpath` option.
* `stat`: An `fs.Stats` object when available.
* `base`: Base directory for the file.
* `relative`: Path relative to `base`.
