const fs = require('fs-extra');

var text = document.getElementById('text');
var deleteBtn = document.getElementById('deleteBtn');
var cancelBtn = document.getElementById('cancelBtn');

// Read working directory from file
var workingDir = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json');

/**
 * Parse folders.json and return array of folder objects or empty array if folders.json doesn't exist
 * @returns {Object[]} Array of folder objects
 */
var fetchFolders = () => {
  try {
    var foldersString = fs.readFileSync(workingDir + '\\folders.json');
    return JSON.parse(foldersString);
  } catch(e) {
    return [];
  }
};

// Get info of folder being deleted by parsing index from element ID
var folderString = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\folderContextId.json');
var folder = JSON.parse(folderString);
folder = folder.replace(/\D/g,''); // Isolate int from string like "folder0"
var index = parseInt(folder);
var folders = fetchFolders();

text.innerHTML = "Delete folder " + folders[index].name + "?"; // Update text to show folder name

/**
 * Stringify array of folders and write to file
 * @param {Object[]} folders - Array of folder objects to be saved
 */ 
var saveFolders = (folders) => {
  fs.writeFileSync(workingDir + '\\folders.json', JSON.stringify(folders));
};

// Close window if cancel button pressed
cancelBtn.addEventListener('click', function() {
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});

// Delete notebook when pressed
deleteBtn.addEventListener('click', function() {
  fs.removeSync(workingDir + '\\' + folders[index].name); // Delete folder in filesystem
  folders.splice(index, 1); // Remove folder from array
  saveFolders(folders); // Save new folder array
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});
