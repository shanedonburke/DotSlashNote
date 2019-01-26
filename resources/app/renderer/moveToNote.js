const fs = require('fs-extra');

// Read working directory from file
var workingDir = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json');

// Search for home directory of notebook by looking for notebooks.json in above directory
var currentDir = workingDir + "";
var aboveDir = currentDir.substr(0, currentDir.lastIndexOf("\\"));
currentDir = aboveDir;

while (!fs.existsSync(aboveDir + '\\notebooks.json')) {
  currentDir = aboveDir;
  aboveDir = aboveDir.substr(0, aboveDir.lastIndexOf("\\"));
}
// Create variable to store home directory of notebook
var homeDir = currentDir;
// Parse title of notebook from folder name
var notebookTitle = homeDir.substr(homeDir.lastIndexOf("\\") + 1);

// Parse array of selected items
var selected = JSON.parse(fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\selected.json'));
var foldersDiv = document.getElementById('folders');
var backBtn = document.getElementById('backBtn')
var okBtn = document.getElementById('okBtn')
var cancelBtn = document.getElementById('cancelBtn');
var dirTitle = document.getElementById("directory");

// Set directory text to notebook title
dirTitle.innerHTML = notebookTitle;

/**
 * Parse folders.json and return array of folder objects or empty array
 * if folders.json does not exist
 * @param {string} dir - Directory to look for folders.json
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
 * Parse notes.json and return array of note objects or empty array
 * if notess.json does not exist
 * @param {string} dir - Directory to look for notes.json
 * @returns {Object[]} Array of note objects
 */
var fetchNotes = (dir) => {
  try {
    var notesString = fs.readFileSync(dir + '\\notes.json');
    return JSON.parse(notesString);
  } catch(e) {
    return [];
  }
};

// Fetch notes from working directory (where items being moved are)
var notes = fetchNotes(workingDir);

/**
 * Update folder listing to show folders in current directory
 */
function refreshFolders() {
  // Remove existing folder elements
  while (foldersDiv.firstChild) {
    foldersDiv.removeChild(foldersDiv.firstChild);
  }

  // Fetch array of folders in current directory
  var folders = fetchFolders(currentDir);
  // Create array to store indices of selected folders in folders.json
  var selectedFolderIndices = [];

  // Store indices of selected folders, so that they can be hidden from the folder listing
  if (currentDir == workingDir) {
    // Disable OK button - the items cannot be moved to the same directory
    okBtn.className = "disabledButton left";
    for (i = 0; i < selected.length; i++) {
      if (selected[i].includes("noteFolder")) {
        // Parse int (index in folders.json) from string like "noteFolder0"
        var folder = selected[i].replace(/\D/g,'');
        var index = parseInt(folder);
        selectedFolderIndices.push(index);
      }
    }
  } else {
    // Enable OK button if current directory is different from source directory
    okBtn.className = "button left";
  }

  for (i = 0; i < folders.length; i++) {
    // Do not show selected folders, because folders cannot be moved into themselves
    if (!selectedFolderIndices.includes(i)) {
      // Create div for folder listing
      var folderDiv = document.createElement("div");
      // Alternate listing colors for easy differentiation
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

// Show folders in home directory of notebook
refreshFolders();

/**
 * Save array of note objects to file by updating notes.json
 * @param {Object[]} notes - Array of note objects
 * @param {dir} dir - Directory in which notes will be saved
 */
var saveNotes = (notes, dir) => {
  fs.writeFileSync(dir + '\\notes.json', JSON.stringify(notes));
};

/**
 * Save array of folder objects to file by updating folders.json
 * @param {Object[]} folders - Array of folder objects
 * @param {dir} dir - Directory in which folders will be saved
 */
var saveFolders = (folders, dir) => {
  fs.writeFileSync(dir + '\\folders.json', JSON.stringify(folders));
};

// Enter folder when clicked
$(document).on('click', '.noteFolder', function() {
  currentDir = currentDir + '/' + this.id;
  // Show folders in new directory
  refreshFolders();
  // Update directory text
  dirTitle.innerHTML = currentDir.replace(homeDir, notebookTitle);
});

// Move up one directory when back button pressed
backBtn.addEventListener('click', function() {
  // Notes cannot be moved outside notebook
  if (currentDir != homeDir) {
    currentDir = currentDir.substr(0, currentDir.lastIndexOf("\\"));
    // Show folders in new directory
    refreshFolders();
  }
});

// Move items when OK button pressed
$("#okBtn").on('click', function() {
  // Do not move items if OK button is disabled
  if (okBtn.className != "disabledButton left") {
    // Create array to store indices of moved notes in notes.json
    var noteIndices = [];
    // Fetch notes in destination directory
    var notesNewDir = fetchNotes(currentDir);
    // Create array to store indices of moved folders in folders.json
    var folderIndices = [];
    // Fetch folders in source directory
    var folders = fetchFolders(workingDir);
    // Fetch folders in destination directory
    var foldersNewDir = fetchFolders(currentDir);
    for (i = 0; i < selected.length; i++) {
      // Detect selected item is a folder
      if (selected[i].includes('noteFolder')) {
        // Parse int (index in folders.json) from string like "noteFolder0"
        var folder = selected[i].replace(/\D/g,'');
        var index = parseInt(folder);
        folderIndices.push(index);
        // Add folder to array of folders in destination directory
        foldersNewDir.unshift(folders[index]);
        // Move folder to new directory
        fs.moveSync(workingDir + '/' + folders[index].name, currentDir + '/' + folders[index].name, { overwrite: true }, err => {
          if (err) {
            alert(err);
          }
        });
        // Detect selected item is note
      } else if (selected[i].includes('note')) {
        // Parse int (index in notes.json) from string like "note0"
        var note = selected[i].replace(/\D/g,'');
        var index = parseInt(note);
        noteIndices.push(index);
        // Add note to array of notes in destination directory
        notesNewDir.unshift(notes[index]);
        // Move note to destination directory
        fs.moveSync(workingDir + '/' + notes[index].id + '.json', currentDir + '/' + notes[index].id + '.json', { overwrite: true }, err => {
          if (err) {
            alert(err);
          }
        });
      }
    }

    // Remove moved notes from array by excluding them from new array
    if (noteIndices.length > 0) {
      // Save notes in destination directory
      saveNotes(notesNewDir, currentDir);
      // Create array to store updated notes array in source directory
      var newNotes = [];
      for (i = 0; i < notes.length; i++) {
        // Add note to array if it hasn't been moved
        if (!noteIndices.includes(i)) {
          newNotes.push(notes[i]);
        }
      }
      // Save notes in source directory
      saveNotes(newNotes, workingDir);
    }

    // Remove moved folders from array by excluding them from new array
    if (folderIndices.length > 0) {
      // Save notes in destination directory
      saveFolders(foldersNewDir, currentDir);
      // Creat array to store updates folders array in source directory
      var newFolders = [];
      for (i = 0; i < folders.length; i++) {
        // Add folder to array if it hasn't been moved
        if (!folderIndices.includes(i)) {
          newFolders.push(folders[i]);
        }
      }
      // Save folders in source directory
      saveFolders(newFolders, workingDir);
    }

    // Close window
    let win = require('electron').remote.getCurrentWindow();
    win.close();
  }
});

// Close window if cancel button pressed
cancelBtn.addEventListener('click', function() {
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});
