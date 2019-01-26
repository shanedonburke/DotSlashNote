const fs = require('fs-extra');

var text = document.getElementById('text');
var deleteBtn = document.getElementById('deleteBtn');
var cancelBtn = document.getElementById('cancelBtn');

var workingDir = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json');

/*
  Parse notebooks.json and return array of notebooks or empty array if notebooks.json doesn't exist
*/
var fetchNotebooks = () => {
  try {
    var notebooksString = fs.readFileSync(workingDir + '\\notebooks.json');
    return JSON.parse(notebooksString);
  } catch(e) {
    return [];
  }
};

// Get element ID from file, then use to find notebook object in array parsed from notebooks.json
var notebookString = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\notebookContextId.json');
var notebook = JSON.parse(notebookString);
notebook = notebook.replace(/\D/g,'');
var index = parseInt(notebook);
var notebooks = fetchNotebooks();

text.innerHTML = "Delete notebook " + notebooks[index].name + "?"; // Set text to show title of notebook being deleted

/*
  Write notebooks array to file
  notebooks: Array of notebook objects to be saved
*/
var saveNotebooks = (notebooks) => {
  fs.writeFileSync(workingDir + '\\notebooks.json', JSON.stringify(notebooks));
};

// Close window if cancel button pressed
cancelBtn.addEventListener('click', function() {
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});

// Delete notebook when delete button pressed
deleteBtn.addEventListener('click', function() {
  fs.removeSync(workingDir + '\\' + notebooks[index].name); // Remove notebook folder from filesystem
  notebooks.splice(index, 1); // Remove notebook from array
  saveNotebooks(notebooks); // Save updated notebook array to file
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});
