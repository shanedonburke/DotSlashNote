const fs = require('fs-extra');
const helper = require('./helper.js')

var text = document.getElementById('text');
var deleteBtn = document.getElementById('deleteBtn');
var cancelBtn = document.getElementById('cancelBtn');

// Read working directory from file
var workingDir = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json');

// Get info of folder being deleted by parsing index from element ID
var folderString = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\folderContextId.json');
var folder = JSON.parse(folderString);
folder = folder.replace(/\D/g,''); // Isolate int from string like "folder0"
var index = parseInt(folder);
var folders = helper.fetchFolders(workingDir);

text.innerHTML = "Delete folder " + folders[index].name + "?"; // Update text to show folder name

// Close window if cancel button pressed
cancelBtn.addEventListener('click', function() {
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});

// Delete notebook when pressed
deleteBtn.addEventListener('click', function() {
  fs.removeSync(workingDir + '\\' + folders[index].name); // Delete folder in filesystem
  folders.splice(index, 1); // Remove folder from array
  helper.saveFolders(folders, workingDir); // Save new folder array
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});
