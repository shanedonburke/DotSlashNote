var fs = require('fs-extra');
var find = require('fs-find');
const { remote } = require('electron');
const { Menu, MenuItem } = remote;

const helper = require('./helper.js')

var editor = document.getElementById('editor');
var welcomeDiv = document.getElementById('welcomeDiv');
var tabBar = document.getElementById('tabs');
var workingDir;

var tabs = [];
var selectedTab;
var ctrlPressed = false;

// Intialize Quill
var quill = new Quill("#richTextArea", {
  theme: 'snow',
  bounds: '#richTextArea',
  modules: {
    'formula': true,
    'syntax': true,
    'toolbar': '#toolbar'
  }
});

// Whitelist fonts with quill
var FontAttributor = Quill.import('attributors/class/font');
FontAttributor.whitelist = [
  'roboto', 'times-new-roman', 'open-sans', 'ubuntu'
];
Quill.register(FontAttributor, true);

// Whitelist font sizes with Quill
var Size = Quill.import('attributors/style/size');
Size.whitelist = ['12px', '14px', '16px', '18px', '20px', '22px'];
Quill.register(Size, true);

/*
  Create new tab element and add to tab tab tab bar
  dir: (string) directory in which the note resides
  id: (string) Uniqid of note
*/
/**
 * Create new tab element and add to tab bar
 * @param {string} dir - directory in which the note resides
 * @param {string} id - Uniqid of note
 */
var createTab = function(dir, id) {
  workingDir = dir; // Set working directory to directory of note
  var notes = helper.fetchNotes(workingDir); // Fetch notes array in working directory
  var note = notes.find(x => x.id === id); // Find note with same ID in notes array
  if (tabs.find(s => s.id == id) == undefined) { // Check if tab is already open
    var span = document.createElement('span'); // Create span to contain tab
    span.className = "tabWrapper";
    var tab = document.createElement('span'); // Create tab element
    tab.className = "tab";
    tab.id = note.id; // Set tab element ID to ID of note
    tab.innerHTML = note.title; // Set tab text to title of note
    tab.addEventListener('click', selectTabClick, false); // Add click event
    tabBar.appendChild(span); // Append tab wrapper to tab bar
    span.appendChild(tab); // Append tab element to tab wrapper

    var closeBtn = document.createElement('span'); // Create close button element
    closeBtn.href = "#";
    closeBtn.className = "closeBtn";
    closeBtn.style = "display: none"; // Hide close button by default
    span.appendChild(closeBtn); // Append close button to tab wrapper

    // Add "X" icon to close button
    var icon = document.createElement("object");
    icon.data = "x.svg";
    icon.type = "image/svg+xml";
    icon.className = "closeSVG";
    closeBtn.appendChild(icon);

    // Show editor if hidden
    if (tabs.length === 0) {
      editor.style = "display: static";
      welcomeDiv.style = "display: none";
    }

    tabs.unshift(note);

    selectTab(tab.id); // Select new tab
  } else {
    // If note is already open, select tab containing note
    selectTab(id);
  }

  refreshTabs();

  // Adjust width of tabs (more tabs -> smaller tabs)
  $('.tabWrapper').width("calc(90% / " + tabs.length + ")");
}

// Close tab
$(document).on('click', '.closeBtn', function() {
  closeTab($(this).parent().children().filter('.tab')[0].id);
});

$(document).keydown(function(event) {
    if(event.which == "17") { // Detect Ctrl press
      ctrlPressed = true;
    } else if (event.which == '83') { // Detect 'S' press
      if (ctrlPressed) {
        // Save note if Ctrl+S
        saveNote();
      }
    }
});

// Detect Ctrl keyup
$(document).keyup(function(event) {
    if(event.which == "17") {
      ctrlPressed = false;
    }
});

/**
 * Save selected note to file by getting contents of editor
 */
var saveNote = function() {
  if (tabs.length > 0) {
    fs.writeFileSync(workingDir + '\\' + selectedTab + '.json', JSON.stringify(quill.getContents()));
  }
}

/**
 * Close tab and remove from tab bar
 * @param {string} id - Uniqid of note
 */
function closeTab(id) {
  saveNote();
  var index = tabs.findIndex(x => x.id === id); // Find index of tab in array
  tabs.splice(index, 1); // Remove tab from tab array
  $('#' + id).parent().remove(); // Remove tabWrapper element
  if (tabs.length === 0) { // Hide editor if no tabs are open
    editor.style = "display: none";
    welcomeDiv.style = "display: static";
  } else {
    // Adjust width of tabs
    $('.tabWrapper').width("calc(90% / " + tabs.length + ")");
    // Select next tab
    selectTab(tabs[0].id);
  }
}

/**
 * Select tab (show contents in editor) when tab element is clicked
 @param {Object} e - Event variable
 */
function selectTabClick(e) {
  $('body').scrollTop( $("#richTextArea").offset().top );
  // Save note before changing
  saveNote();
  selectedTab = e.target.id;
  refreshTabs();
  // Show contents of new note
  showNote(selectedTab);
}

/**
 * Select tab and show contents in editor
 * @param {string} id - Uniqid of note
 */
function selectTab(id) {
  // Scroll to top of editor
  $('body').scrollTop( $("#richTextArea").offset().top );
  if (tabs.length > 0) {
    // Save note before changing
    saveNote();
  }
  selectedTab = id;
  refreshTabs();
  // Show contents of new note
  showNote(selectedTab);
}

/**
 * Show contents of note in editor
 * @param {string} id - Uniqid of note
 */
function showNote(id) {
  // Find note file using ID
  find(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data', function(err, results) {
    if(err) {
      alert(err);
    }
    for (i = 0; i < results.length; i++) {
      // Check if file is the one we're looking for
      if (results[i].name === id + '.json') {
        var file = results[i].file;
        // Replace backslashes with forward slashes
        file = file.replace(/\\/g,"/");
        // Set editor contents to empty if empty note. Otherwise show contents of file
        if (fs.readFileSync(file) != "") {
          quill.setContents(JSON.parse(fs.readFileSync(file)));
        } else {
          quill.setContents("");
        }
      }
    }
  });
}

/**
 * Update tab elements to highlight selected tab
 */
function refreshTabs() {
  for (i = 0; i < tabs.length; i++) {
    if (tabs[i].id === selectedTab) {
      document.getElementById(tabs[i].id).parentElement.className = "tabWrapper tabSelected";
    } else {
      document.getElementById(tabs[i].id).parentElement.className = "tabWrapper";
    }
  }
}

/**
 * Close tab if note is deleted while open
 * @param {string} id - Uniqid of note
 */
var closeDeletedTab = function(id) {
  if (typeof tabs.find(x => x.id === id) != undefined) {
    closeTab(id);
  }
}

// Show close button when mouse is on tab
$(document).on('mouseenter', '.tabWrapper', function() {
  $(this).children().filter('.closeBtn')[0].style = "display: inline-block";
});

// Hide close button when mouse leaves tab
$(document).on('mouseleave', '.tabWrapper', function() {
  $(this).children().filter('.closeBtn')[0].style = "display: none";
});

// Save note every minute
setInterval(saveNote, 60000);

// Export functions for use in renderer.js
module.exports = {
  createTab,
  closeDeletedTab,
  saveNote
}
