import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script loaded');

const api = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  getStats: () => ipcRenderer.invoke('get-stats'),
  updateStats: (stats: any) => ipcRenderer.invoke('update-stats', stats),
  minimize: () => ipcRenderer.send('minimize-window'),
  close: () => ipcRenderer.send('close-window'),
  toggleCompactMode: () => {
    console.log('toggleCompactMode called from preload');
    ipcRenderer.send('toggle-compact-mode');
  },
  isCompactMode: () => ipcRenderer.invoke('is-compact-mode'),
  updateMenubarTimer: (timeRemaining: number, isRunning: boolean, totalTime?: number) => 
    ipcRenderer.send('update-menubar-timer', timeRemaining, isRunning, totalTime)
};

contextBridge.exposeInMainWorld('api', api);
console.log('API exposed to main world:', api);