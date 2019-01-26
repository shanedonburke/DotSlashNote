const fs = require('fs-extra');

// Read working directory (where items being moved are) from file
var workingDir = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json');
// Set current directory (where items will be moved to) to data folder
var currentDir = __dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data';

// Parse IDs of selected objects
var selected = JSON.parse(fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\selected.json'));
var foldersDiv = document.getElementById('folders');
var backBtn = document.getElementById('backBtn')
var okBtn = document.getElementById('okBtn')
var cancelBtn = document.getElementById('cancelBtn');
var dirTitle = document.getElementById("directory");

/**
 * Parse folders.json and return array of folder objects or empty array
 * if folders.json does not exist
 * @returns {Object[]} Array of folder objects
 */
var fetchFolders = (dir) => {
  try {
    var foldersString = fs.readFileSync(dir + '\\folders.json');
    return JSON.parse(foldersString);
  } catch(e) {
    return [];
  }
};

/**
 * Parse notebooks.json and return array of notebook objects or empty array
 * if notebooks.json does not exist
 * @returns {Object[]} Array of note objects
 */
var fetchNotebooks = (dir) => {
  try {
    var notebooksString = fs.readFileSync(dir + '\\notebooks.json');
    return JSON.parse(notebooksString);
  } catch(e) {
    return [];
  }
};

// Fetch array of notebooks in working directory
var notebooks = fetchNotebooks(workingDir);

/**
 * Show list of folders in current directory
 */
function refreshFolders() {
  // Remove existing folder elements
  while (foldersDiv.firstChild) {
    foldersDiv.removeChild(foldersDiv.firstChild);
  }

  // Fetch array of folders in current directory
  var folders = fetchFolders(currentDir);
  // Create array to store indices of selected folders in folders array
  var selectedFolderIndices = [];

  // If current directory contains items being moved,
  // store indices of selected folders in current directory so that they can be hidden
  if (currentDir == workingDir) {
    for (i = 0; i < selected.length; i++) {
      if (selected[i].includes("folder")) {
        // Parse int from string like "folder0"
        var folder = selected[i].replace(/\D/g,'');
        var index = parseInt(folder);
        // Add index of folder to selectedFolderIndices
        selectedFolderIndices.push(index);
      }
    }
  }

  for (i = 0; i < folders.length; i++) {
    // Do not show selected folders in folder list, because folders cannot be moved into themselves
    if (!selectedFolderIndices.includes(i)) {
      // Create div to store folder listing
      var folderDiv = document.createElement("div");
      // Alternate folder coloring for easy differentiation
      if (i % 2 === 0) {
        folderDiv.className = "noteFolder";
      } else {
        folderDiv.className = "noteFolder alt";
      }
      // Create folder icon
      var folder = document.createElement("object");
      folder.data = "folder.svg";
      folder.type = "image/svg+xml";
      folder.className = "smallFolderSVG";
      folderDiv.appendChild(folder);
      // Create text element to show folder name
      var nameText = document.createElement("span");
      nameText.className = "folderText";
      nameText.id = 'noteFolderText' + i;
      nameText.innerHTML = folders[i].name;
      folderDiv.id = folders[i].name;
      foldersDiv.appendChild(folderDiv);
      folderDiv.appendChild(nameText);
    }
  }
}

// Show folders in data directory
refreshFolders();

/**
 * Save array of notebook objects to file by updating notebooks.json
 * @param {Object[]} notebooks - Array of notebook objects
 * @param {dir} dir - Directory in which notebooks will be saved
 */
var saveNotebooks = (notebooks, dir) => {
  fs.writeFileSync(dir + '\\notebooks.json', JSON.stringify(notebooks));
};

/**
 * Save array of folder objects to file by updating folders.json
 * @param {Object[]} folders - Array of folder objects
 * @param {dir} dir - Directory in which folders will be saved
 */
var saveFolders = (folders, dir) => {
  fs.writeFileSync(dir + '\\folders.json', JSON.stringify(folders));
};

// Enter folder when folder element is clicked
$(document).on('click', '.noteFolder', function() {
  currentDir = currentDir + '\\' + this.id;
  refreshFolders(); // Show folders in new directory
  // Update directory listing text
  dirTitle.innerHTML = currentDir.replace(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data', "Home");
});

// Move up one folder when back button is pressed
backBtn.addEventListener('click', function() {
  if (currentDir != 'data') { // Data is the highest level directory
    currentDir = currentDir.substr(0, currentDir.lastIndexOf("\\"));
    // Update directory listing text
    dirTitle.innerHTML = currentDir.replace(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data', "Home");
    refreshFolders(); // Show folders in new directory
  }
});

// Move items when OK button pressed
$("#okBtn").on('click', function() {
  // Create array to store indices of notebooks being moved in notebooks.json
  var notebookIndices = [];
  // Fetch array of notebooks in destination directory
  var notebooksNewDir = fetchNotebooks(currentDir);
  // Create array to store indices of folders being moved in folders.json
  var folderIndices = [];
  // Fetch array of folders in working directory
  var folders = fetchFolders(workingDir);
  // Fetch array of folders in destination directory
  var foldersNewDir = fetchFolders(currentDir);
  for (i = 0; i < selected.length; i++) {
    if (selected[i].includes('notebook')) {
      // Parse int (index in notebooks.json) from string like "notebook0"
      var notebook = selected[i].replace(/\D/g,'');
      var index = parseInt(notebook);
      notebookIndices.push(index);
      // Add notebook to array of notebooks in destination directory
      notebooksNewDir.unshift(notebooks[index]);
      // Move notebook folder to new directory
      fs.moveSync(workingDir + '\\' + notebooks[index].name, currentDir + '\\' + notebooks[index].name, { overwrite: true }, err => {
        if (err) {
          alert(err);
        }
      });
    }
    if (selected[i].includes('folder')) {
      // Parse int (index in folders.json) from string like "folder0"
      var folder = selected[i].replace(/\D/g,'');
      var index = parseInt(folder);
      folderIndices.push(index);
      // Add folder to array of folders in destination directory
      foldersNewDir.unshift(folders[index]);
      // Move folder to destination directory
      fs.moveSync(workingDir + '\\' + folders[index].name, currentDir + '\\' + folders[index].name, { overwrite: true }, err => {
        if (err) {
          alert(err);
        }
      });
    }
  }

  // Remove moved notebooks from array by excluding them from new array
  if (notebookIndices.length > 0) {
    // Save array of notebooks in destination directory
    saveNotebooks(notebooksNewDir, currentDir);
    // Create array to store notebooks that haven't been moved
    var newNotebooks = [];
    for (i = 0; i < notebooks.length; i++) {
      if (!notebookIndices.includes(i)) {
        // Add notebook to array if it hasn't been moved
        newNotebooks.push(notebooks[i]);
      }
    }
    // Save new array to working directory
    saveNotebooks(newNotebooks, workingDir);
  }

  // Remove moved folders from array by excluding them from new array
  if (folderIndices.length > 0) {
    // Save array of folders in destination directory
    saveFolders(foldersNewDir, currentDir);
    // Create array to store notebooks that haven't been moved
    var newFolders = [];
    for (i = 0; i < folders.length; i++) {
      if (!folderIndices.includes(i)) {
        // Add folder to array if it hasn't been moved
        newFolders.push(folders[i]);
      }
    }
    // Save new array to working directory
    saveFolders(newFolders, workingDir);
  }

  // Close window
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});

// Close window if cancel button pressed
cancelBtn.addEventListener('click', function() {
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});
