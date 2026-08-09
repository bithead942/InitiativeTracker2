const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const dataFile = path.join(app.getPath('userData'), 'initiative-data.json');
const windows = [];

function createWindow(file = 'index.html') {
  Menu.setApplicationMenu(null);

  const win = new BrowserWindow({
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

  win.loadFile(file);
  win.on('closed', () => {
    const idx = windows.indexOf(win);
    if (idx > -1) windows.splice(idx, 1);
  });
  windows.push(win);
  return win;
}

function loadData() {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { characters: [], activeIndex: 0 };
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Save failed:', err);
  }
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = windows.find(w => w && !w.isDestroyed());
    if (win) win.focus();
  });

  app.whenReady().then(() => {
    createWindow('index.html');
    createWindow('player.html');
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (windows.length === 0) {
      createWindow('index.html');
      createWindow('player.html');
    }
  });

  ipcMain.handle('load-data', loadData);
  ipcMain.handle('save-data', (event, data) => {
    saveData(data);
    return true;
  });
}
