const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.send('save-data', data),
  saveDataSync: (data) => ipcRenderer.sendSync('save-data-sync', data)
});
