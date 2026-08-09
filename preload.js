const { contextBridge, ipcRenderer } = require('electron');

const isPlayer = process.argv.includes('--player-view');

contextBridge.exposeInMainWorld('api', {
  isPlayer,
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  onDataChange: (callback) => ipcRenderer.on('data-changed', callback)
});
