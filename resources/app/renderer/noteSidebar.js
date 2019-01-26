var fs = require('fs-extra');
var uniqid = require('uniqid');
const { BrowserWindow } = require('electron').remote;
const { remote } = require('electron');
const { Menu, MenuItem } = remote;

const moment = require('moment');
var findInFiles = require('find-in-files');

var notebooks, index;

var noteSidebar = document.getElementById('noteSidebar');
var backBtn = document.getElementById('backBtn');
var newNoteBtn = document.getElementById('newNoteBtn');
var searchBtn = document.getElementById('searchBtn');
var tooltip = document.getElementById('tooltip');
var searchbar = document.getElementById('searchbar');
var notesDiv = document.getElementById('notes');

var workingDir;
var homeDir;

// folderContextId - Stores element ID of right-clicked folder
var folderContextId = "";
// noteContextId - Stores element ID of right-clicked note
var noteContextId = "";
// selected - Array of selected element IDs
var selected = [];
var ctrlPressed = false;
var shiftPressed = false;

let win = require('electron').remote.getCurrentWindow();

// Menu shown when new button is pressed
const newMenu = new Menu();
// New note
newMenu.append(new MenuItem({ label: 'Note', click() {
  notes = fetchNotes();

  // Create note object with Uniqid and date as title
  var note = {
    id: uniqid(),
    title: moment().format('L')
  };

  // Add note to notes array
  notes.unshift(note);
  // Create note file
  fs.writeFileSync(workingDir + '\\' + note.id + '.json', '');
  // Save updated notes array
  saveNotes(notes);
  // Refresh notes to show new note in list
  refreshNotes();

  // Set new note title to editable and select title
  $('#noteText0').attr('contentEditable','true');
  selectText('noteText0');
}}));

// New folder
newMenu.append(new MenuItem({label: 'Folder', click() {
  // Create new folder
  addFolder();
  // Refresh notes to show new folder in list
  refreshNotes();
  // Set folder name to editable and select name
  $('#noteFolderText0').attr('contentEditable','true');
  selectText('noteFolderText0');
}}));

// Context menu when a folder is right-clicked
const folderMenu = new Menu();
// Rename folder
folderMenu.append(new MenuItem({label: 'Rename', click() {
  // Set folder name to editable and select name text
  $('#' + folderContextId).children('.folderText').attr('contentEditable','true');
  selectText($('#' + folderContextId).children('.folderText')[0].id);
}}));

// Delete folder
folderMenu.append(new MenuItem({label: 'Delete', click() {
  // Write element ID of folder to folderContextId.json
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\folderContextId.json', JSON.stringify(folderContextId));

  // Open delete folder window
  let folderWin = new BrowserWindow({
     width: 300,
     height: 140,
     title: "Delete Folder",
     resizable: false,
     minimizable: false,
     parent: win,
     modal: true
   });
   folderWin.setMenu(null);

   folderWin.loadURL('file://' + __dirname + '/deleteFolder.html');

   folderWin.on('closed', () => {
     // Update sidebar to reflect deletion of folder
     refreshNotes();
   });
}}));

// Menu shown when note is right-clicked
const noteMenu = new Menu();
// Rename folder
noteMenu.append(new MenuItem({ label: 'Rename', click() {
  // Set note title to editable and select title text
  $('#' + noteContextId).children('.noteText').attr('contentEditable','true');
  selectText($('#' + noteContextId).children('.noteText')[0].id);
}}));

// Move note
noteMenu.append(new MenuItem({label: 'Move to...', click() {
  // Write element ID of selected note to selected.json
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\selected.json', JSON.stringify(selected));

  // Open Move to... window
  let noteWin = new BrowserWindow({
     width: 500,
     height: 450,
     title: "Move to...",
     resizable: false,
     minimizable: false,
     parent: win,
     modal: true
   });
   noteWin.setMenu(null);

   noteWin.loadURL('file://' + __dirname + '/moveToNote.html');

   noteWin.on('closed', () => {
     // Refresh sidebar to reflect changes
     refreshNotes();
   });
}}));

// Delete note
noteMenu.append(new MenuItem({ label: 'Delete', click() {
  // Write element ID of note to noteContextId.json
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\noteContextId.json', JSON.stringify(noteContextId));

  let noteWin = new BrowserWindow({
     width: 300,
     height: 140,
     title: "Delete Note",
     resizable: false,
     minimizable: false,
     parent: win,
     modal: true
   });
   noteWin.setMenu(null);

   noteWin.loadURL('file://' + __dirname + '/deleteNote.html');

   noteWin.on('closed', () => {
     // Refresh sidebar to reflect changes
     refreshNotes();
   });
}}));

// Menu shown when multiple items are selected
const multipleMenu = new Menu();

// Move items
multipleMenu.append(new MenuItem({label: 'Move to...', click() {
  // Write element IDs of selected items to selected.json
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\selected.json', JSON.stringify(selected));

  // Open Move to... window
  let noteWin = new BrowserWindow({
     width: 500,
     height: 450,
     title: "Move to...",
     resizable: false,
     minimizable: false,
     parent: win,
     modal: true
   });
   noteWin.setMenu(null);

   noteWin.loadURL('file://' + __dirname + '/moveToNote.html');

   noteWin.on('closed', () => {
     // Update sidebar to reflect changes
     refreshNotes();
   });
}}));

// Delete items
multipleMenu.append(new MenuItem({label: 'Delete', click() {
  // Write element IDs of selected items to selected.json
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\selected.json', JSON.stringify(selected));

  // Open delete window
  let noteWin = new BrowserWindow({
     width: 300,
     height: 140,
     title: "Delete",
     resizable: false,
     minimizable: false,
     parent: win,
     modal: true
   });
   noteWin.setMenu(null);

   noteWin.loadURL('file://' + __dirname + '/deleteMultiple.html');

   noteWin.on('closed', () => {
     refreshNotes();
   });
}}));

/**
 * Update item selection and open appropriate menu when note is right-clicked
 * @param [Object] e - Event variable
 */
function noteContextMenu(e) {
  // Select note if no items are selected
  if (selected.length === 0) {
    selected.push(this.id);
    $(this).addClass('selected');
    noteContextId = this.id;
    noteMenu.popup({ window: remote.getCurrentWindow() });
  } else {
    // Unselect selected notes and select right-clicked note if note is not already selected
    if (!$(this).hasClass("selected")) {
      $('.noteFolder, .note').removeClass('selected');
      selected = [];
      selected.push(this.id);
      $(this).addClass('selected');
      noteContextId = this.id;;
      noteMenu.popup({ window: remote.getCurrentWindow() });
    } else {
      // Open single note menu if note is the only item selected
      if (selected.length === 1) {
        noteContextId = this.id;
        noteMenu.popup({ window: remote.getCurrentWindow() });
      } else {
        // Open multiple item menu if multiple items are selected
        multipleMenu.popup({ window: remote.getCurrentWindow() });
      }
    }
  }
}

/**
 * Send message to renderer.js that note has been opened
 * @param {Object} e - Event variable
 */
function openNote(e) {
  // Close search tooltip
  tooltip.style = "display: none";
  // Parse int (index in notes.json) from string like "note0"
  var indexString = this.id.replace(/\D/g,'');
  var index = parseInt(indexString);
  var notes = fetchNotes();
  let win = require('electron').remote.getCurrentWindow();
  // Send message to renderer.js containing note Uniqid
  win.webContents.send('note-opened', notes[index].id);
}

// Rename folder when enter is pressed while editing
$(document).on('keypress','.folderText', function(e) {
  if (e.which === 13) {
    $(this).attr('contentEditable', 'false');
    renameFolder(e.target.id);
  }
});

// Rename note when enter is pressed while editing
$(document).on('keypress','.noteText', function(e) {
  if (e.which === 13) {
    $(this).attr('contentEditable', 'false');
    renameNote(e.target.id);
  }
});

// Check if control or shift is pressed
$(document).keydown(function(event) {
    if(event.which == "17") {
      ctrlPressed = true;
    } else if (event.which == '16') {
      shiftPressed = true;
    }
});

// Check if control or shift is released
$(document).keyup(function(event) {
  if(event.which == "17") {
    ctrlPressed = false;
  } else if (event.which == '16') {
    shiftPressed = false;
  }
});

// Select note or folder when clicked
$(document).on('click', '.noteFolder, .note', function() {
  if (ctrlPressed) {
    if ($(this).hasClass('selected')) { // Remove element from selection
      $(this).removeClass('selected');
      var index = selected.findIndex(s => s === this.id);
      selected.splice(index, 1);
    } else { // Add element to selection
      selected.push(this.id);
      $(this).addClass('selected');
    }
  } else if (shiftPressed) {
    if (!this.id.includes("noteFolder")) { // Detect note clicked
      // Parse int (index of selected note in notes.json) from string like "note0"
      var selectedIndexString = this.id.replace(/\D/g,'');
      var selectedIndex = parseInt(selectedIndexString);

      // Determine if selected note is above or below existing selection
      var lowestIndex = 1000;
      var highestIndex = -1000;
      var folderSelected = false;
      for (i = 0; i < selected.length; i++) {
        // Check if any folders are included in selection
        if (selected[i].includes("noteFolder")) {
          folderSelected = true;
        }
        // Parse int (index in array) from element ID
        var indexString = selected[i].replace(/\D/g,'');
        var index = parseInt(indexString);
        // Find hightest and lowest indices of current selection
        if (index < lowestIndex) {
          lowestIndex = index;
        }
        if (index > highestIndex) {
          highestIndex = index;
        }
      }
      if (!folderSelected) {
        // Selected item is above current selection
        if (selectedIndex > highestIndex) {
          // Select items between existing selection and selected item
          for (i = highestIndex + 1; i <= selectedIndex; i++) {
            selected.push('notebook' + i);
            $('#note' + i).addClass('selected');
          }
        }
        // Selected item is below current selection
        if (selectedIndex < lowestIndex) {
          // Select items between existing selection and selected item
          for (i = selectedIndex; i < lowestIndex; i++) {
            selected.push('notebook' + i);
            $('#note' + i).addClass('selected');
          }
        }
      }
    }
  } else {
    // Neither Ctrl or Shift pressed, change selection to new item only
    $('.noteFolder, .note').removeClass('selected');
    selected = [];
    selected.push(this.id);
    $(this).addClass('selected');
  }
});

// Save name changes to notes and folders when window is clicked
$(window).click(function() {
  var folders = fetchFolders();
  for (i = 0; i < folders.length; i++) {
    if ($('#noteFolderText' + i).is("[contentEditable]")) {
      // Make folder name uneditable
      $('#noteFolderText' + i).attr('contentEditable', false);
      // Save changes to name
      renameFolder('noteFolderText' + i);
    }
  }

  var notes = fetchNotes();
  for (i = 0; i < notes.length; i++) {
    if ($('#noteText' + i).is("[contentEditable]")) {
      // Make note title uneditable
      $('#noteText' + i).attr('contentEditable', false);
      // Save changes to note title
      renameNote('noteText' + i);
    }
  }
});

/**
 * Save changes to the name of a folder
 * @param {string} id - Element ID of folder
 */
function renameFolder(id) {
  // Parse int (index in folders array) from elemtent ID
  var indexString = id.replace(/\D/g,'');
  var index = parseInt(indexString);
  var folders = fetchFolders();
  // Rename directory
  fs.rename(workingDir + '\\' + folders[index].name, workingDir + '\\' + document.getElementById(id).innerHTML, function(error) {});
  // Update folder object
  folders[index].name = document.getElementById(id).innerHTML;
  // Save changes to array
  saveFolders(folders);
  // Update sidebar to show changes
  refreshNotes();
}

/**
 * Save changes to the name of a note
 * @param {string} id - Element ID of note
 */
function renameNote(id) {
  // Parse int (index in notes array) from element ID
  var indexString = id.replace(/\D/g,'');
  var index = parseInt(indexString);
  var notes = fetchNotes();
  // Update note object
  notes[index].title = document.getElementById(id).innerHTML;
  // Save changes to array
  saveNotes(notes);
  // Refresh sidebar to show changes
  refreshNotes();
}

/**
 * Highlight/select text in given element
 * @param {string} element - ID of element
 */
function selectText(element) {
  var doc = document
    , text = doc.getElementById(element)
    , range, selection
  ;
  if (doc.body.createTextRange) {
    range = document.body.createTextRange();
    range.moveToElementText(text);
    range.select();
  } else if (window.getSelection) {
    selection = window.getSelection();
    range = document.createRange();
    range.selectNodeContents(text);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

/**
 * Create new folder.
 */
function addFolder() {
  var folders = fetchFolders();

  var folderName = 'New Folder';
  // Name new folder such that its name does not conflict with any existing folders
  // If New Folder and New Folder 1 exists, then the new folder will be
  // New Folder 2
  var folderCount = 0;
  while (fs.existsSync(workingDir + '\\' + folderName)) {
    folderCount++;
    folderName = 'New Folder ' + folderCount;
  }

  // Create folder directory
  fs.mkdirSync(workingDir + '\\' + folderName);
  // Add folder to array
  folders.unshift({name: folderName});
  // Save changes to array
  saveFolders(folders);
  // Refresh sidebar to show changes
  refreshNotes();
}

/**
 * Update item selection and open appropriate menu when folder is right-clicked
 * @param [Object] e - Event variable
 */
function folderContextMenu(e) {
  // Select folder if no items are selected
  if (selected.length === 0) {
    selected.push(this.id);
    $(this).addClass('selected');
    folderContextId = this.id;
    folderMenu.popup({ window: remote.getCurrentWindow() });
  } else {
    // Unselect selected items and select folder if not already selected
    if (!$(this).hasClass("selected")) {
      $('.noteFolder, .note').removeClass('selected');
      selected = [];
      selected.push(this.id);
      $(this).addClass('selected');
      folderContextId = this.id;;
      folderMenu.popup({ window: remote.getCurrentWindow() });
    } else {
      if (selected.length === 1) {
        // Open folder menu
        folderContextId = this.id;
        folderMenu.popup({ window: remote.getCurrentWindow() });
      } else {
        // Open multiple item menu
        multipleMenu.popup({ window: remote.getCurrentWindow() });
      }
    }
  }
}

/**
 * Save array of folder objects to folders.json
 * @param {Object[]} folders - Array of folder objects to be saved
 */
var saveFolders = (folders) => {
  fs.writeFileSync(workingDir + '\\folders.json', JSON.stringify(folders));
};

/**
 * Enter folder when clicked
 * @param {Object} e - Event object
 */
function openFolder(e) {
  // Parse int (index in folder array) from element ID
  var id = this.id;
  var indexString = id.replace(/\D/g,'');
  var index = parseInt(indexString);
  var folders = fetchFolders();
  // Change working directory to that of folder
  workingDir = workingDir + '\\' + folders[index].name;
  // Write working directory to file
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json', workingDir);
  // Refresh sidebar to show contents of entered folder
  refreshNotes();
}

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

/**
 * Refresh sidebar display to show changes
 */
var refreshNotes = () => {
  // Remove existing elements from sidebar
  while (notesDiv.firstChild) {
    notesDiv.removeChild(notesDiv.firstChild);
  }

  workingDir = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json', 'utf8');
  var notes = fetchNotes();
  var folders = fetchFolders();

  for (i = 0; i < folders.length; i++) {
    // Create div to hold folder listing
    var folderDiv = document.createElement("div");
    // Alternate colors for easy differentiation
    if ((i+folders.length) % 2 === 0) {
      folderDiv.className = "noteFolder";
    } else {
      folderDiv.className = "noteFolder alt";
    }
    folderDiv.id = 'noteFolder' + i;
    folderDiv.addEventListener('contextmenu', folderContextMenu, false);
    folderDiv.addEventListener('dblclick', openFolder, false);
    notesDiv.appendChild(folderDiv);
    // Create folder icon
    var folder = document.createElement("object");
    folder.data = "folder.svg";
    folder.type = "image/svg+xml";
    folder.className = "smallFolderSVG";
    folderDiv.appendChild(folder);
    // Create element to store folder name
    var nameText = document.createElement("span");
    nameText.className = "folderText";
    nameText.id = 'noteFolderText' + i;
    nameText.innerHTML = folders[i].name;
    folderDiv.appendChild(nameText);
  }

  for (i = 0; i < notes.length; i++) {
    // Create div to hold note listing
    var div = document.createElement("div");
    // Alternate colors for easy differentiation
    if (i % 2 === 0) {
      div.className = "note";
    } else {
      div.className = "note alt";
    }
    div.id = "note" + i;
    div.addEventListener('contextmenu', noteContextMenu, false);
    div.addEventListener('dblclick', openNote, false);
    notesDiv.appendChild(div);
    // Create note icon
    var noteSVG = document.createElement("object");
    noteSVG.data = "note.svg";
    noteSVG.type = "image/svg+xml";
    noteSVG.className = "noteSVG";
    div.appendChild(noteSVG);
    // Create element to show note title
    var nameText = document.createElement("span");
    nameText.className = "noteText";
    nameText.id = 'noteText' + i;
    nameText.innerHTML = notes[i].title;
    div.appendChild(nameText);
  }

  // Create filler element to ensure that all listings are shown
  var div = document.createElement("div");
  div.className = "filler";
  notesDiv.appendChild(div);
}

/**
 * Save array of note objects to notes.json
 * @param {Object[]} notes - Array of note objects
 */
var saveNotes = (notes) => {
  fs.writeFileSync(workingDir + '\\notes.json', JSON.stringify(notes));
};

/**
 * Search notes in current notebook for a string
 * @param {string} pattern - String to search for
 */
function searchNotes(pattern) {
  var searchResults = [];
  // Find pattern in .json files, ignoring case
  findInFiles.find({term: pattern, flags: 'ig'}, homeDir, '.json$')
    .then(function(results) {
      for (var result in results) {
        result = result.replace(/\\/g,"/");
        // Exclude notes.json and folders.json
        if (!searchResults.includes(result) && !result.includes('notes.json') && !result.includes('folders.json')) {
          searchResults.push(result);
        }
      }
      // Write results to results.json
      fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\results.json', JSON.stringify(searchResults));
      // Send message to renderer.js to show search sidebar
      win.webContents.send('search', 'search');
    });
}

// Move up one directory when back button pressed
backBtn.addEventListener('mouseup', function() {
  // Hide search tooltip
  tooltip.style = "display: none";
  let win = require('electron').remote.getCurrentWindow();
  if (workingDir === homeDir) {
    // Exit notebook if in root directory of notebook
    workingDir = workingDir.substr(0, workingDir.lastIndexOf("\\"));
    fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json', workingDir);
    // Send message to renderer.js to show notebook sidebar
    win.webContents.send('notebook-closed', 'closed');
  } else {
    // Move up one directory
    workingDir = workingDir.substr(0, workingDir.lastIndexOf("\\"));
    fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json', workingDir);
    // Refresh sidebar to show contents of new directory
    refreshNotes();
  }
});

// Show new menu when new button pressed
newNoteBtn.addEventListener('mouseup', function() {
  // Hide search tooltip
  tooltip.style = "display: none";
  // Show menu
  newMenu.popup({ window: remote.getCurrentWindow() });
});

// Show or hide search tooltip when search button pressed
searchBtn.addEventListener("click", function() {
  if ($("#tooltip").css('display') == "none") {
    // Show search tooltip
    tooltip.style = "display: static";
    // Clear input
    searchbar.value = "";
  } else {
    // Hide tooltip if already shown
    tooltip.style = "display: none";
  }
});

// Search when enter pressed in searchbar
$("#searchbar").on('keydown', function(e) {
  if (e.which === 13) { // Enter
    searchNotes(searchbar.value);
    // Hide tooltip
    tooltip.style = "display: none";
  }
});

/**
 * Initialize note sidebar
 */
function init() {
  // Capture home directory of notebook
  homeDir = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json', "utf8");
  workingDir = homeDir;
  // Refresh sidebar to show contents of notebook
  refreshNotes();
}

module.exports = {
  init
};
