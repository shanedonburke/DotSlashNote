const fs = require('fs-extra');
const helper = require('./helper.js')

var text = document.getElementById('text');
var deleteBtn = document.getElementById('deleteBtn');
var cancelBtn = document.getElementById('cancelBtn');

var workingDir = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json');

// Get element ID from file, then use to find notebook object in array parsed from notebooks.json
var notebookString = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\notebookContextId.json');
var notebook = JSON.parse(notebookString);
notebook = notebook.replace(/\D/g,'');
var index = parseInt(notebook);
var notebooks = helper.fetchNotebooks(workingDir);

text.innerHTML = "Delete notebook " + notebooks[index].name + "?"; // Set text to show title of notebook being deleted

// Close window if cancel button pressed
cancelBtn.addEventListener('click', function() {
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});

// Delete notebook when delete button pressed
deleteBtn.addEventListener('click', function() {
  fs.removeSync(workingDir + '\\' + notebooks[index].name); // Remove notebook folder from filesystem
  notebooks.splice(index, 1); // Remove notebook from array
  helper.saveNotebooks(notebooks, workingDir); // Save updated notebook array to file
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});
