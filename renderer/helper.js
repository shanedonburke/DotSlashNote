/**
 * Parse folders.json and return array of folder objects or empty array
 * if folders.json does not exist
 * @returns {Object[]} Array of folder objects
 */
var fetchFolders = (dir) => {
  try {
    var foldersString = fs.readFileSync(dir + '\\folders.json');
    return JSON.parse(foldersString);
  } catch(e) {
    return [];
  }
};

/**
 * Parse notebooks.json and return array of notebook objects or empty array
 * if notebooks.json does not exist
 * @returns {Object[]} Array of note objects
 */
var fetchNotebooks = (dir) => {
  try {
    var notebooksString = fs.readFileSync(dir + '\\notebooks.json');
    return JSON.parse(notebooksString);
  } catch(e) {
    return [];
  }
};

/**
 * Parse notes.json and return array of note objects or empty array
 * if notess.json does not exist
 * @param {string} dir - Directory to look for notes.json
 * @returns {Object[]} Array of note objects
 */
var fetchNotes = (dir) => {
  try {
    var notesString = fs.readFileSync(dir + '\\notes.json');
    return JSON.parse(notesString);
  } catch(e) {
    return [];
  }
};

/**
 * Save array of folder objects to file by updating folders.json
 * @param {Object[]} folders - Array of folder objects
 * @param {dir} dir - Directory in which folders will be saved
 */
var saveFolders = (folders, dir) => {
  fs.writeFileSync(dir + '\\folders.json', JSON.stringify(folders));
};

/**
 * Save array of note objects to file by updating notes.json
 * @param {Object[]} notes - Array of note objects
 * @param {dir} dir - Directory in which notes will be saved
 */
var saveNotes = (notes, dir) => {
  fs.writeFileSync(dir + '\\notes.json', JSON.stringify(notes));
};

/**
 * Save array of notebook objects to file by updating notebooks.json
 * @param {Object[]} notebooks - Array of notebook objects
 * @param {dir} dir - Directory in which notebooks will be saved
 */
var saveNotebooks = (notebooks, dir) => {
  fs.writeFileSync(dir + '\\notebooks.json', JSON.stringify(notebooks));
};

module.exports = {
  fetchFolders,
  fetchNotebooks,
  fetchNotes,
  saveFolders,
  saveNotes,
  saveNotebooks
}
