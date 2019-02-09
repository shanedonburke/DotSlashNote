const fs = require('fs-extra');
const helper = require('./helper.js')

var text = document.getElementById('text');
var deleteBtn = document.getElementById('deleteBtn');
var cancelBtn = document.getElementById('cancelBtn');

// Read working directory from file
var workingDir = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json');

// Get element ID from file, then use to find note object in array parsed from notes.json
var noteString = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\noteContextId.json');
var note = JSON.parse(noteString);
note = note.replace(/\D/g,''); // Isolate int from string like "note0"
var index = parseInt(note);
var notes = helper.fetchNotes(workingDir);

text.innerHTML = "Delete note " + notes[index].title + "?"; // Set text to show title of note being deleted

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
  helper.saveNotes(notes, workingDir); // Save new notes array to file
  win.close();
});
