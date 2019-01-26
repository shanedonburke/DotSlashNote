const fs = require('fs-extra');

var text = document.getElementById('text');
var deleteBtn = document.getElementById('deleteBtn');
var cancelBtn = document.getElementById('cancelBtn');

// Read working directory from file
var workingDir = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json');

/**
 * Parse notes.json and return array of note objects or empty array
 * if notes.json does not exist
 * @returns {Object[]} Array of note objects
 */
var fetchNotes = () => {
  try {
    var notesString = fs.readFileSync(workingDir + '\\notes.json');
    return JSON.parse(notesString);
  } catch(e) {
    return [];
  }
};

/**
 * Parse notebooks.json and return array of notebook objects or empty array
 * if notebooks.json does not exist
 * @returns {Object[]} Array of notebook objects
 */
var fetchNotebooks = () => {
  try {
    var notebooksString = fs.readFileSync(workingDir + '\\notebooks.json');
    return JSON.parse(notebooksString);
  } catch(e) {
    return [];
  }
};

/**
 * Parse folders.json and return array of folder objects or empty array
 * if folders.json does not exist
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

// Read selected.json to get element IDs of selected items
var selected = JSON.parse(fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\selected.json'));
var folders = fetchFolders();
var notebooks = fetchNotebooks();
var notes = fetchNotes();

// Change text to reflect number of items being deleted
text.innerHTML = "Delete " + selected.length + " items?";

/**
 * Save array of note objects to notes.json
 * @param {Object[]} notes - Array of note objects to be saved
 */
var saveNotes = (notes) => {
  fs.writeFileSync(workingDir + '\\notes.json', JSON.stringify(notes));
};

/**
 * Save array of folder objects to folders.json
 * @param {Object[]} folders - Array of folder objects to be saved
 */
var saveFolders = (folders) => {
  fs.writeFileSync(workingDir + '\\folders.json', JSON.stringify(folders));
};

/**
 * Save array of notebook objects to notebooks.json
 * @param {Object[]} notebooks - Array of notebook objects to be saved
 */
var saveNotebooks = (notes) => {
  fs.writeFileSync(workingDir + '\\notebooks.json', JSON.stringify(notes));
};


// Close window if cancel button pressed
cancelBtn.addEventListener('click', function() {
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});

// Delete items when delete button pressed
deleteBtn.addEventListener('click', function() {
  // Create arrays to store indices of items being deleted
  var notebookIndices = [];
  var folderIndices = [];
  var noteIndices = [];

  // Iterate through selected items
  for (i = 0; i < selected.length; i++) {
    if (selected[i].includes('folder') || selected[i].includes('noteFolder')) { // Detect if item is a folder
      var folder = selected[i].replace(/\D/g,''); // Isolate int from string like "folder0"
      var index = parseInt(folder);
      folderIndices.push(index); // Add index for deletion
      fs.removeSync(workingDir + '\\' + folders[index].name); // Remove folder from filesystem
    } else if (selected[i].includes('notebook')) { // Detect if item is a notebook
      var notebook = selected[i].replace(/\D/g,''); // Isolate int from string like "notebook0"
      var index = parseInt(notebook);
      notebookIndices.push(index); // Add index for deletion
      fs.removeSync(workingDir + '\\' + notebooks[index].name); // Remove notebook folder from filesystem
    }
    else if (selected[i].includes('note')) { // Detect if item is a note
      var note = selected[i].replace(/\D/g,''); // Isolate int from string like "note0"
      var index = parseInt(note);
      noteIndices.push(index); // Add index for deletion
      let win = require('electron').remote.getCurrentWindow();
      win.getParentWindow().webContents.send('note-deleted', notes[index].id); // Send message to renderer.js
      fs.removeSync(workingDir + '\\' + notes[index].id + '.json'); // Remove note from filesystem
    }
  }

  // If notebooks were deleted, add elements from notebook array to new array, excluding deleted notebooks
  if (notebookIndices.length > 0) {
    var newNotebooks = [];
    for (i = 0; i < notebooks.length; i++) {
      if (!notebookIndices.includes(i)) {
        newNotebooks.push(notebooks[i]);
      }
    }
    saveNotebooks(newNotebooks); // Save new notebook array to file
  }

  // If folderss were deleted, add elements from folder array to new array, excluding deleted folders
  if (folderIndices.length > 0) {
    var newFolders = [];
    for (i = 0; i < folders.length; i++) {
      if (!folderIndices.includes(i)) {
        newFolders.push(folders[i]);
      }
    }
    saveFolders(newFolders); // Save new folder array to file
  }

  // If notes were deleted, add elements from note array to new array, excluding deleted notes
  if (noteIndices.length > 0) {
    var newNotes = [];
    for (i = 0; i < notes.length; i++) {
      if (!noteIndices.includes(i)) {
        newNotes.push(notes[i]);
      }
    }
    saveNotes(newNotes); // Save new note array to file
  }

  // Close window
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});
