const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;
const { Menu, MenuItem } = require('electron');

const path = require('path');
const url = require('url');

let win;


/**
 * Create main window
 */
function createMainWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "./note",
    resizable: true,
    icon: __dirname + '/icon.ico'
  });


  win.loadURL(url.format({
    pathname: path.join(__dirname, 'renderer', 'index.html'),
    slashes: true
  }));

  // Menu bar template
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Save (Ctrl+S)',
          click() {
            // Save note in editor
            win.webContents.send('save', 'save');
          }
        },
        { type: 'separator' },
        { label: 'Save and Exit',
          click() {
            // Save note in editor and exit
            win.webContents.send('save', 'save');
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut'},
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About',
          click() {
            // Show about window
            let aboutWin = new BrowserWindow({
               width: 800,
               height: 800,
               title: "About",
               resizable: false,
               minimizable: false,
               parent: win,
               modal: true
             });
             aboutWin.setMenu(null);

             aboutWin.loadURL('file://' + __dirname + '/renderer/about.html');
          }
        }
      ]
    }
  ]

  // Built menu from template
  const menu = Menu.buildFromTemplate(template);
  win.setMenu(menu);

  // Close program when main window is closed
  win.on('closed', () => {
    app.quit();
  });
}

// Create main window when app is ready
app.on('ready', createMainWindow);
