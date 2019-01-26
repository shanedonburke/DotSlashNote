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

// Get element ID from file, then use to find note object in array parsed from notes.json
var noteString = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\noteContextId.json');
var note = JSON.parse(noteString);
note = note.replace(/\D/g,''); // Isolate int from string like "note0"
var index = parseInt(note);
var notes = fetchNotes();

text.innerHTML = "Delete note " + notes[index].title + "?"; // Set text to show title of note being deleted

/*
  Write notes array to file
  notes: Array of notes to be saved
*/
var saveNotes = (notes) => {
  fs.writeFileSync(workingDir + '\\notes.json', JSON.stringify(notes));
};

// Close window if cancel button pressed
cancelBtn.addEventListener('click', function() {
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});

// Delete note when delete button pressed
deleteBtn.addEventListener('click', function() {
  let win = require('electron').remote.getCurrentWindow();
  win.getParentWindow().webContents.send('note-deleted', notes[index].id); // Send message to renderer.js
  fs.removeSync(workingDir + '\\' + notes[index].id + '.json'); // Remove note from filesystem
  notes.splice(index, 1); // Remove note from notes array
  saveNotes(notes); // Save new notes array to file
  win.close();
});
