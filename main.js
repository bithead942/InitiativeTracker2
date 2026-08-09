const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const dataFile = path.join(app.getPath('userData'), 'initiative-data.json');

let mainWindow;

function createWindow() {
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 345,
    height: 600,
    title: 'D&D Initiative Tracker 2.0',
    minimizable: false,
    maximizable: false,
    resizable: false,
    useContentSize: true,
    icon: path.join(__dirname, 'assets', 'app-icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('load-data', () => {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
});

ipcMain.on('save-data-sync', (event, data) => {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Save failed:', err);
  }
  event.returnValue = true;
});
