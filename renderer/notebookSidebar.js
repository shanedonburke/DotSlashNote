const { BrowserWindow } = require('electron').remote;
const dialog = require('electron').remote.dialog;

const fs = require('fs');
const helper = require('./helper.js')

var find = require('fs-find');
var QuillDeltaToHtmlConverter = require('quill-delta-to-html').QuillDeltaToHtmlConverter;
var pdf = require('html-pdf');

// Set working directory to home directory
var workingDir = __dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data';
// Write working directory to workingDir.json
fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json', workingDir);

var newBtn = document.getElementById('newBtn');
var backBtn = document.getElementById('notebookBackBtn');
var notebooksDiv = document.getElementById('notebooks');
const { remote } = require('electron');
const { Menu, MenuItem } = remote;

// notebookContextId - Stores element ID of right-clicked notebook
var notebookContextId = "";
// folderContextId - Stores element ID of right-clicked folder
var folderContextId = "";
// notebookOpened - Stores element ID of opened notebook
var notebookOpened = "";

var ctrlPressed = false;
var shiftPressed = false;
// selected - Stores element IDs of selected items
var selected = [];

let win = require('electron').remote.getCurrentWindow();

// Menu shown when notebook is right-clicked
const notebookMenu = new Menu();
// Edit notebook
notebookMenu.append(new MenuItem({ label: 'Edit', click() {
  // Write element ID of right-clicked notebook to notebookContextId.json
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\notebookContextId.json', JSON.stringify(notebookContextId));

  // Open editing window
  let notebookWin = new BrowserWindow({
     width: 400,
     height: 350,
     title: "Edit Notebook",
     resizable: false,
     minimizable: false,
     parent: win,
     modal: true
   });
   notebookWin.setMenu(null);

   notebookWin.loadURL('file://' + __dirname + '/editNotebook.html');

   notebookWin.on('closed', () => {
     // Refresh sidebar to show changes
     refreshNotebooks();
   });
}}));

// Move notebook
notebookMenu.append(new MenuItem({ label: 'Move to...', click() {
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\selected.json', JSON.stringify(selected));
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\notebookContextId.json', JSON.stringify(notebookContextId));

  // Open Move to... window
  let notebookWin = new BrowserWindow({
     width: 500,
     height: 450,
     title: "Move to...",
     resizable: false,
     minimizable: false,
     parent: win,
     modal: true
   });
   notebookWin.setMenu(null);

   notebookWin.loadURL('file://' + __dirname + '/moveTo.html');

   notebookWin.on('closed', () => {
     // Refresh sidebar to show changes
     refreshNotebooks();
   });
}}));

// Export notebook
notebookMenu.append(new MenuItem({ label: 'Export', click() {
  // dest - Stores destination path
  var dest;
  // Parse int (index in notebooks.json) from element ID
  var indexString = notebookContextId.replace(/\D/g,'');
  var index = parseInt(indexString);
  var notebooks = helper.fetchNotebooks(workingDir);
  var notebookTitle = notebooks[index].name;

  // Show dialog, wherein user chooses destination
  dialog.showSaveDialog( require('electron').remote.getCurrentWindow(), {
    defaultPath: notebookTitle + '.pdf'
  }, function(filename, bookmark) {
    // notesDelta - Stores contents of editor as delta object
    var notesDelta = [];
    // Read stylesheet from file and add to document
    var htmlDoc = fs.readFileSync(__dirname + '\\exportStyle.html');

    // html-pdf options
    config = {
      "border": {
        "top": "0.5in",
        "right": "0.5n",
        "bottom": "0.5in",
        "left": "0.5in"
      }
    }
    // Find files in notebook folder
    find(workingDir + '\\' + notebooks[index].name, function(err, results) {
      if(err) {
        alert(err);
      }
      for (i = 0; i < results.length; i++) {
        // Exclude notes.json and folders.json
        if (results[i].name != "notes.json" && results[i].name != "folders.json") {
          // Read file
          var file = fs.readFileSync(results[i].file);
          // Parse Uniqid from file path
          var id = results[i].file.substr(results[i].file.lastIndexOf("\\") + 1, results[i].file.lastIndexOf("."));
          // Remove .json from end of ID
          id = id.replace(".json", "")
          // Find notes.json in same directory as file
          var notesJSON = results[i].file.substr(0, results[i].file.lastIndexOf('\\')) + '\\notes.json';
          // Parse notes.json
          var notesParsed = JSON.parse(fs.readFileSync(notesJSON));
          // Find index of note in notes.json
          var index = notesParsed.findIndex(s => s.id === id);
          // Find name of note
          var name = notesParsed[index].title;
          // Add object containing note title and delta object to array
          notesDelta.push({
            name: name,
            data: JSON.parse(file)
          });
        }
      }

      // Convert delta objects to HTML and add to document
      for (i = 0; i < notesDelta.length; i++) {
        var converter = new QuillDeltaToHtmlConverter(notesDelta[i].data.ops, {});
        // Convert delta object to HTML
        var html = converter.convert();
        // Add note title to top of page
        htmlDoc += "<center><h2>" + notesDelta[i].name + "</h2></center>";
        // Add note contents to page
        htmlDoc += html;
        // Break page before next note
        htmlDoc += "\n<p style='page-break-before: always'>\n";
      }
      // Create PDF out of HTML document
      pdf.create(htmlDoc, config).toFile(filename, function(err, res) {
        alert("PDF creation complete.");
        if (err) {
          alert(err);
        }
      });
    });
  });
}}));

// Delete notebook
notebookMenu.append(new MenuItem({ label: 'Delete', click() {
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\notebookContextId.json', JSON.stringify(notebookContextId));

  // Open deletion window
  let notebookWin = new BrowserWindow({
     width: 300,
     height: 140,
     title: "Delete Notebook",
     resizable: false,
     minimizable: false,
     parent: win,
     modal: true
   });
   notebookWin.setMenu(null);

   notebookWin.loadURL('file://' + __dirname + '/deleteNotebook.html');

   notebookWin.on('closed', () => {
     // Refresh sidebar to show changes
     refreshNotebooks();
   });
}}));

// Menu shown when multiple items are selected
const multipleMenu = new Menu();

// Move items
multipleMenu.append(new MenuItem({label: 'Move to...', click() {
  // Save selected element IDs to selected.json
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\selected.json', JSON.stringify(selected));

  // Open Move to... window
  let notebookWin = new BrowserWindow({
     width: 500,
     height: 450,
     title: "Move to...",
     resizable: false,
     minimizable: false,
     parent: win,
     modal: true
   });
   notebookWin.setMenu(null);

   notebookWin.loadURL('file://' + __dirname + '/moveTo.html');

   notebookWin.on('closed', () => {
     // Refresh sidebar to show changes
     refreshNotebooks();
   });
}}));

// Delete items
multipleMenu.append(new MenuItem({label: 'Delete', click() {
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\selected.json', JSON.stringify(selected));

  // Open deletion window
  let notebookWin = new BrowserWindow({
     width: 300,
     height: 140,
     title: "Delete",
     resizable: false,
     minimizable: false,
     parent: win,
     modal: true
   });
   notebookWin.setMenu(null);

   notebookWin.loadURL('file://' + __dirname + '/deleteMultiple.html');

   notebookWin.on('closed', () => {
     // Refresh sidebar to show changes
     refreshNotebooks();
   });
}}));

// Menu shown when new button is pressed
const newMenu = new Menu();

// New notebook
newMenu.append(new MenuItem({label: 'Notebook', click() {

  // Open new notebook window
  let notebookWin = new BrowserWindow({
     width: 400,
     height: 350,
     title: "New Notebook",
     resizable: false,
     minimizable: false,
     parent: win,
     modal: true
   });
   notebookWin.setMenu(null);

   notebookWin.loadURL('file://' + __dirname + '/newNotebook.html');

   notebookWin.on('closed', () => {
     // Refresh sidebar to show changes
     refreshNotebooks();
   });
}}));

// New folder
newMenu.append(new MenuItem({label: 'Folder', click() {
  addFolder();
  // Refresh sidebar to show new folder
  refreshNotebooks();
  // Make folder name editable and select name text
  $('#folderText0').attr('contentEditable','true');
  selectText('folderText0');
}}));

// Menu shown when a folder is right-clicked
const folderMenu = new Menu();

// Rename folder
folderMenu.append(new MenuItem({label: 'Rename', click() {
  // Make folder name editable and select name text
  $('#' + folderContextId).children('.folderText').attr('contentEditable','true');
  selectText($('#' + folderContextId).children('.folderText')[0].id);
}}));

// Move folder
folderMenu.append(new MenuItem({ label: 'Move to...', click() {
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\selected.json', JSON.stringify(selected));
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\folderContextId.json', JSON.stringify(folderContextId));

  // Open Move to... window
  let folderWin = new BrowserWindow({
     width: 300,
     height: 400,
     title: "Move to...",
     resizable: false,
     minimizable: false,
     parent: win,
     modal: true
   });
   folderWin.setMenu(null);

   folderWin.loadURL('file://' + __dirname + '/moveTo.html');

   folderWin.on('closed', () => {
     // Refresh sidebar to show changes
     refreshNotebooks();
   });
}}));

// Delete folder
folderMenu.append(new MenuItem({label: 'Delete', click() {
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\folderContextId.json', JSON.stringify(folderContextId));

  // Open deletion window
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
     // Refresh sidebar to show changesS
     refreshNotebooks();
   });
}}));

// Save changes when enter is pressed while editing folder name
$(document).on('keypress','.folderText', function(e) {
  if (e.which === 13) { // Enter
    // Make name text not editable
    $(this).attr('contentEditable', 'false');
    renameFolder(e.target.id);
  }
});

// Make folder names uneditable and save changes when user clicks in window
$(window).click(function() {
  var folders = helper.fetchFolders(workingDir);
  for (i = 0; i < folders.length; i++) {
    if ($('#folderText' + i).is("[contentEditable]")) {
      $('#folderText' + i).attr('contentEditable', false);
      renameFolder('folderText' + i);
    }
  }
});

// Check if Ctrl or Shift is pressed
$(document).keydown(function(event) {
    if(event.which == "17") { // Ctrl
      ctrlPressed = true;
    } else if (event.which == '16') { // Shift
      shiftPressed = true;
    }
});

// Check if Ctrl or Shift is released
$(document).keyup(function(event) {
  if(event.which == "17") { // Ctrl
    ctrlPressed = false;
  } else if (event.which == '16') { // Shift
    shiftPressed = false;
  }
});

// Select elements when clicked
$(document).on('click', '.notebook, .folder', function() {
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
    if (this.id.includes("notebook")) { // Detect notebook clicked
      // Parse int (index of selected notebook in notebooks.json) from string like "notebook0"
      var selectedIndexString = this.id.replace(/\D/g,'');
      var selectedIndex = parseInt(selectedIndexString);

      // Determine if selected note is above or below existing selection
      var lowestIndex = 1000;
      var highestIndex = -1000;
      var folderSelected = false;
      for (i = 0; i < selected.length; i++) {
        // Check if any folders are included in selection
        if (selected[i].includes("folder")) {
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
            $('#notebook' + i).addClass('selected');
          }
        }
        // Selected item is below current selection
        if (selectedIndex < lowestIndex) {
          // Select items between existing selection and selected item
          for (i = selectedIndex; i < lowestIndex; i++) {
            selected.push('notebook' + i);
            $('#notebook' + i).addClass('selected');
          }
        }
      }
    }
  } else {
    // Neither Ctrl or Shift pressed, change selection to new item only
    $('.notebook, .folder').removeClass('selected');
    selected = [];
    selected.push(this.id);
    $(this).addClass('selected');
  }
});

/**
 * Rename a folder
 * @param {string} id - Element ID of folder
 */
function renameFolder(id) {
  // Parse int from string like "folder0"
  var indexString = id.replace(/\D/g,'');
  var index = parseInt(indexString);
  var folders = helper.fetchFolders(workingDir);
  // Rename directory
  fs.rename(workingDir + '\\' + folders[index].name, workingDir + '\\' + document.getElementById(id).innerHTML, function(error) {});
  // Update folders array
  folders[index].name = document.getElementById(id).innerHTML;
  helper.saveFolders(folders, workingDir);
  // Refresh sidebar to show changes
  refreshNotebooks();
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
 * Create new folder
 */
function addFolder() {
  var folders = helper.fetchFolders(workingDir);

  var folderName = 'New Folder';
  // Name new folder such that its name does not conflict with any existing folders
  // If New Folder and New Folder 1 exists, then the new folder will be
  // New Folder 2
  var folderCount = 0;
  while (fs.existsSync(workingDir + '\\' + folderName)) {
    folderCount++;
    folderName = 'New Folder ' + folderCount;
  }
  fs.mkdirSync(workingDir + '\\' + folderName);
  folders.unshift({name: folderName});
  helper.saveFolders(folders, workingDir);
}

/**
 * Update item selection and open appropriate menu when notebook is right-clicked
 * @param [Object] e - Event variable
 */
function notebookContextMenu(e) {
  // Select notebook if no items are selected
  if (selected.length === 0) {
    selected.push(this.id);
    $(this).addClass('selected');
    notebookContextId = this.id;
    notebookMenu.popup({ window: remote.getCurrentWindow() });
  } else {
    // Unselect selected items and select notebook if not already selected
    if (!$(this).hasClass("selected")) {
      $('.notebook, .folder').removeClass('selected');
      selected = [];
      selected.push(this.id);
      $(this).addClass('selected');
      notebookContextId = this.id;;
      notebookMenu.popup({ window: remote.getCurrentWindow() });
    } else {
      if (selected.length === 1) {
        // If notebook is only item selected, open notebook menu
        notebookContextId = this.id;
        notebookMenu.popup({ window: remote.getCurrentWindow() });
      } else {
        // Open multiple item menu
        multipleMenu.popup({ window: remote.getCurrentWindow() });
      }
    }
  }
}

/**
 * Update item selection and open appropriate menu when folder is right-clicked
 * @param [Object] e - Event variable
 */
function folderContextMenu(e) {
  // Select folder if no items are selected
  if (selected.length === 0) {
    folderContextId = this.id;
    selected.push(this.id);
    $(this).addClass('selected');
    folderMenu.popup({ window: remote.getCurrentWindow() });
  } else {
    // Unselect selected items and select folder if not already selected
    if (!$(this).hasClass("selected")) {
      $('.notebook, .folder').removeClass('selected');
      selected = [];
      selected.push(this.id);
      $(this).addClass('selected');
      folderContextId = this.id;
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
 * Send message to renderer.js that notebook has been opened
 * @param {Object} e - Event variable
 */
function openNotebook(e) {
  notebookOpened = this.id;
  var notebook = notebookOpened;
  // Parse int (index in notebook array) from string like "notebook0"
  notebook = notebook.replace(/\D/g,'');
  var index = parseInt(notebook);
  var notebooks = helper.fetchNotebooks(workingDir);
  // Update working directory to that of opened notebook
  workingDir = workingDir + '\\' + notebooks[index].name;
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json', workingDir);
  // Send message to renderer.js
  win.webContents.send('notebook-opened', notebookOpened);
}

/**
 * Enter directory of folder
 * @param {Object} e - Event object
 */
function openFolder(e) {
  // Parse int (index in folders array) from element ID
  var id = this.id;
  var indexString = id.replace(/\D/g,'');
  var index = parseInt(indexString);
  var folders = helper.fetchFolders(workingDir);
  // Update working directory
  workingDir = workingDir + '\\' + folders[index].name;
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json', workingDir);
  // Show back button if hidden
  backBtn.style = "display: static";
  // Refresh sidebar to show contents of new directory
  refreshNotebooks();
}


/**
 * Refresh folder and notebook listings in sidebar
 */
var refreshNotebooks = () => {
  // Remove existing elements from sidebar
  while (notebooksDiv.firstChild) {
    notebooksDiv.removeChild(notebooksDiv.firstChild);
  }

  workingDir = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json', 'utf8');
  var folders = helper.fetchFolders(workingDir);
  var notebooks = helper.fetchNotebooks(workingDir);

  // Create folder listings
  for (i = 0; i < folders.length; i++) {
    var folderDiv = document.createElement("div");
    // Alternate colors for easy differentiation
    if (i % 2 === 0) {
      folderDiv.className = "folder";
    } else {
      folderDiv.className = "folder alt";
    }
    folderDiv.id = 'folder' + i;
    folderDiv.addEventListener('contextmenu', folderContextMenu, false);
    folderDiv.addEventListener('dblclick', openFolder, false);
    notebooksDiv.appendChild(folderDiv);
    // Create folder icon
    var folder = document.createElement("object");
    folder.data = "folder.svg";
    folder.type = "image/svg+xml";
    folder.className = "folderSVG";
    folderDiv.appendChild(folder);
    // Create folder name text
    var nameText = document.createElement("span");
    nameText.className = "folderText";
    nameText.id = 'folderText' + i;
    nameText.innerHTML = folders[i].name;
    folderDiv.appendChild(nameText);
  }


  // Create notebook listings
  for (i = 0; i < notebooks.length; i++) {
    var div = document.createElement("div");
    // Alternate colors for easy differentiation
    if ((i+folders.length) % 2 === 0) {
      div.className = "notebook";
    } else {
      div.className = "notebook alt";
    }
    div.id = "notebook" + i;
    div.addEventListener('contextmenu', notebookContextMenu, false);
    div.addEventListener('dblclick', openNotebook, false);
    notebooksDiv.appendChild(div);
    // Create notebook title text
    var notebookText = document.createElement("div");
    notebookText.className = "notebookText";
    div.appendChild(notebookText);
    // Create colored dot next to title
    var dot = document.createElement("span");
    dot.className = "dot";
    dot.style = "background-color: " + notebooks[i].color;
    notebookText.appendChild(dot);
    var nameText = document.createElement("span");
    nameText.className = "nameText";
    nameText.innerHTML = notebooks[i].name;
    notebookText.appendChild(nameText);
  }

  // Add filler element to pad bottom of list
  var div = document.createElement("div");
  div.className = "filler";
  notebooksDiv.appendChild(div);
};

// Show folders and notebooks in home directory
refreshNotebooks();

// New button menu
newBtn.addEventListener("click", function() {
  newMenu.popup({ window: remote.getCurrentWindow() });
});

// Go up one directory when back button pressed
backBtn.addEventListener("click", function() {
  workingDir = workingDir.substr(0, workingDir.lastIndexOf("\\"));
  fs.writeFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json', workingDir);
  // Hide back button when in home directory
  if (workingDir === "data") {
    backBtn.style = "display: none";
  }
  refreshNotebooks();
});



module.exports = {
  refreshNotebooks
}
