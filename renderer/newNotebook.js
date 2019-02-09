const fs = require('fs');
const helper = require('./helper.js')

var okBtn = document.getElementById('okBtn');
var cancelBtn = document.getElementById('cancelBtn');
var color = document.getElementById('color');

// Read wokring directory from file
var workingDir = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json');
// Set default color value
var colorValue = "#FF0000";

/**
 * Detect if string is empty or only whitespace
 @param {string} str - String to check for emptiness
 @returns {boolean} True if string is is empty
 */
 function isEmpty(str){
    return !str.replace(/\s+/, '').length;
}

// Disable OK button if input field is empty
document.querySelector("input").addEventListener('input', function(e) {
  if (isEmpty(this.value)) {
    okBtn.className = "disabledButton left";
  } else {
    okBtn.className = "button left";
  }
});

/**
 * Add notebook to array if not a duplicate
 * @param {string} name - Name of new notebook
 * @param {string} color - Hex color strin
 */
var addNotebook = (name, color) => {
  var notebooks = fetchNotebooks();

  // Create notebook object
  var notebook = {
    name,
    color
  };

  // Find if notebook with same name already exists
  var duplicateNotebooks = notebooks.filter((notebook) => notebook.name === name);

  // Add notebook if not a duplicate
  if (duplicateNotebooks.length === 0) {
    // Add notebook to array
    notebooks.unshift(notebook);
    // Create notebook folder
    fs.mkdirSync(workingDir + '\\' + notebook.name);
    // Save updated array
    helper.saveNotebooks(notebooks, workingDir);
  }
}

/**
 * Update colorValue to reflect value of color picker
 * @param {string} jscolor - Hex value of color input
 */
function update(jscolor) {
  colorValue = "#" + jscolor;
}

// Close window if cancel button pressed
cancelBtn.addEventListener('click', function() {
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});

// Add notebook if name is entered and OK button is pressed
okBtn.addEventListener('click', function() {
  if (okBtn.className === "button left") {
    addNotebook(document.querySelector("input").value, colorValue);

    // Close window
    let win = require('electron').remote.getCurrentWindow();
    win.close();
  }
});
