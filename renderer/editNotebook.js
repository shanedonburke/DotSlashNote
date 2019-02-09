const fs = require('fs-extra');
const helper = require('./helper.js')

var nameInput = document.getElementById('name');
var colorInput = document.getElementById('color');
var okBtn = document.getElementById('okBtn');
var cancelBtn = document.getElementById('cancelBtn');

// Read working directory from file
var workingDir = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\workingDir.json');

// Get element ID from file, then use to find notebook object in array parsed from notebooks.json
var notebookString = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\notebookContextId.json');
var notebook = JSON.parse(notebookString);
notebook = notebook.replace(/\D/g,'');
var index = parseInt(notebook);
var notebooks = helper.fetchNotebooks(workingDir);

nameInput.value = notebooks[index].name; // Set default name to existing name
// Init jscolor input with existing notebook color
colorInput.className = "jscolor {valueElement:null,value:'" + notebooks[index].color.substr(1) + "',onFineChange:'update(this)'}";
var colorValue = notebooks[index].color; // Initialize variable to store color value

/**
 * Save changes to notebook
 * @param {string} name - New name of notebook
 * @param {string} color - Hex color string
 */
var editNotebook = function(name, color) {
  var notebook = {
    name,
    color
  };

  var duplicateNotebooks = []; // Array to store notebooks with duplicate names
  for (i = 0; i < notebooks.length; i++) {
    if (notebooks[i].name === name && i !== index) { // Detect duplicate, exclude self
      duplicateNotebooks.push(notebooks[i]); // Add duplicate notebook to array
    }
  }
  if (duplicateNotebooks.length === 0) { // No duplicates found
    fs.rename(workingDir + '\\' + notebooks[index].name, workingDir + '\\' + name, function(error) {}); // Rename folder
    notebooks[index] = notebook; // Update notebook object in array
    helper.saveNotebooks(notebooks, workingDir); // Save new notebook array to file
  }
}

/**
 * Detect if string is empty or only whitespace
 @param {string} str - String to check for emptiness
 @returns {boolean} True if string is is empty
 */
function isEmpty(str){
    return !str.replace(/\s+/, '').length;
}

/**
 * Update colorValue to reflect value of color picker
 * @param {string} jscolor - Hex value of color input
 */
function update(jscolor) {
  colorValue = "#" + jscolor;
}

// Update OK button when text is entered into name input
nameInput.addEventListener('input', function() {
  if (isEmpty(this.value)) {
    okBtn.className = "disabledButton left"; // Name input is empty, disable OK button
  } else {
    okBtn.className = "button left"; // Name input is not empty, enable OK button
  }
});

// Close window if cancel button pressed
cancelBtn.addEventListener('click', function() {
  let win = require('electron').remote.getCurrentWindow();
  win.close();
});

// Save changes when OK button is pressed
okBtn.addEventListener('click', function() {
  if (okBtn.className === "button left") { // Check if OK button is enabled
    editNotebook(nameInput.value, colorValue);

    let win = require('electron').remote.getCurrentWindow();
    win.close();
  }
});
