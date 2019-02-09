const ipcRenderer = require('electron').ipcRenderer;
const fs = require('fs');

// Require scripts
const notebookSidebarJS = require('./notebookSidebar.js');
const noteSidebarJS = require('./noteSidebar.js');
const searchSidebarJS = require('./searchSidebar.js');
const editorJS = require('./editor.js');

// Different sidebars
var notebookSidebar = document.getElementById('notebookSidebar');
var noteSidebar = document.getElementById('noteSidebar');
var searchSidebar = document.getElementById('searchSidebar')

notebookSidebar.style.display = "inline";

// Sent by notebookSidebar.js when user opens notebook
ipcRenderer.on('notebook-opened', function(event, arg) {
  // Initialize note sidebar
  noteSidebarJS.init();

  // Hide notebook sidebar, show note sidebar
  notebookSidebar.style.display = "none";
  noteSidebar.style.display = "inline";
});

// Sent by noteSidebar.js when user closes notebook
ipcRenderer.on('notebook-closed', function(event, arg) {
  // Hide note sidebar, show notebook sidebar
  notebookSidebar.style.display = "inline";
  noteSidebar.style.display = "none";
  // Refresh notebook sidebar
  notebookSidebarJS.refreshNotebooks();
});

// Sent by noteSidebar.js when user opens note
ipcRenderer.on('note-opened', function(event, arg) {
  var workingDir = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json');
  // Create tab in editor
  editorJS.createTab(workingDir, arg);
});

// Sent by searchSidebar.js when user opens search result
ipcRenderer.on('result-opened', function(event, arg) {
  // Set working directory to directory of note
  var workingDir = arg.substr(0, arg.lastIndexOf("/"));
  // Get ID of note
  var id = arg.substr(arg.lastIndexOf("/") + 1);
  id = id.replace(".json", "");
  // Create tab in editor
  editorJS.createTab(workingDir, id);
});

// Sent by noteSidebar.js when search is completed
ipcRenderer.on('search', function(event, arg) {
  // Show search sidebar, hide note sidebar
  searchSidebar.style.display = "inline";
  noteSidebar.style.display = "none";
  // Show results in search sidebar
  searchSidebarJS.showNotes();
});

// Sent by searchSidebar.js when user backs out of search results
ipcRenderer.on('search-closed', function(event, arg) {
  // Hide search sidebar, show note sidebar
  searchSidebar.style.display = "none";
  noteSidebar.style.display = "inline";
});

// Sent by noteSidebar.js when a note is deleted
ipcRenderer.on('note-deleted', function(event, arg) {
  // Close tab in editor
  editorJS.closeDeletedTab(arg);
});

// Sent by main.js when File > Save is clicked
ipcRenderer.on('save', function(event, arg) {
  // Save note in editor
  editorJS.saveNote();
});
