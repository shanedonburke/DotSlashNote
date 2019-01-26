var searchBackBtn = document.getElementById('searchBackBtn');
var notesDiv = document.getElementById('searchNotes');

let win = require('electron').remote.getCurrentWindow();

// Close search results when back button pressed
searchBackBtn.addEventListener("click", function() {
  win.webContents.send("search-closed", 'closed');
});

/**
 * Show search results in sidebar
 */
var showNotes = () => {
  // Read search results from results.json
  var results = JSON.parse(fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf("\\")) + '\\data\\results.json'));

  // Remove existing elements from sidebar
  while (notesDiv.firstChild) {
    notesDiv.removeChild(notesDiv.firstChild);
  }

  for (i = 0; i < results.length; i++) {
    var div = document.createElement("div");
    // Alternate colors for easy differentiation
    if (i % 2 === 0) {
      div.className = "note";
    } else {
      div.className = "note alt";
    }

    div.id = results[i];
    div.addEventListener('dblclick', openNote, false);
    notesDiv.appendChild(div);

    // Create note icon
    var noteSVG = document.createElement("object");
    noteSVG.data = "note.svg";
    noteSVG.type = "image/svg+xml";
    noteSVG.className = "noteSVG";
    div.appendChild(noteSVG);

    // Create name text
    var nameText = document.createElement("span");
    nameText.className = "noteText";
    // Find notes.json and get notes array
    var notesJSON = results[i].substr(0, results[i].lastIndexOf("/")+1) + "notes.json";
    var notes = JSON.parse(fs.readFileSync(notesJSON));
    // Get note ID from result path
    var id = results[i].substr(results[i].lastIndexOf("/") + 1);
    id = id.replace(".json", "");
    // Find note in notes array
    var note = notes.find(x => x.id === id);
    // Set name text to title of note
    nameText.innerHTML = note.title;
    div.appendChild(nameText);
  }

  var div = document.createElement("div");
  div.className = "filler";
  notesDiv.appendChild(div);
}

/**
 * Open note in editor
 * @param {Object} e - Event object
 */
function openNote(e) {
  let win = require('electron').remote.getCurrentWindow();
  // Send message to renderer.js containing note ID
  win.webContents.send("result-opened", this.id);
}

module.exports = {
  showNotes
}
