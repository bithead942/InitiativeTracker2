const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const dataFile = path.join(app.getPath('userData'), 'initiative-data.json');
const windows = [];
let closingAll = false;

function createWindow(file = 'index.html', isPlayer = false) {
  Menu.setApplicationMenu(null);

  const win = new BrowserWindow({
    width: 410,
    height: 650,
    title: 'D&D Initiative Tracker 2.0',
    minimizable: false,
    maximizable: false,
    resizable: isPlayer,
    useContentSize: true,
    icon: path.join(__dirname, 'assets', 'app-icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(file);
  win.on('close', () => {
    if (closingAll) return;
    closingAll = true;
    windows.forEach(w => {
      if (w !== win && !w.isDestroyed()) w.close();
    });
  });
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

function saveData(data, sender) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    broadcast('data-changed', sender);
  } catch (err) {
    console.error('Save failed:', err);
  }
}

function broadcast(channel, sender) {
  windows.forEach(w => {
    if (w && !w.isDestroyed() && w.webContents !== sender) w.webContents.send(channel);
  });
}

function keepMaximized(win) {
  let maximizeTimer = null;
  win.on('moved', () => {
    clearTimeout(maximizeTimer);
    maximizeTimer = setTimeout(() => {
      if (win.isDestroyed()) return;
      if (!win.isMaximized() && !win.isMinimized() && !win.isFullScreen()) {
        win.maximize();
      }
    }, 100);
  });
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
    const playerWin = createWindow('player.html', true);
    playerWin.maximize();
    keepMaximized(playerWin);

    const dmWin = createWindow('index.html', false);
    dmWin.center();
    dmWin.focus();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (windows.length === 0) {
      const playerWin = createWindow('player.html', true);
      playerWin.maximize();
      keepMaximized(playerWin);
      const dmWin = createWindow('index.html', false);
      dmWin.center();
      dmWin.focus();
    }
  });

  ipcMain.handle('load-data', loadData);
  ipcMain.handle('save-data', (event, data) => {
    saveData(data, event.sender);
    return true;
  });
}
