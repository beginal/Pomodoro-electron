import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAPI, Settings, Stats } from '../types';

console.log('Preload script loaded');

const api: ElectronAPI = {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: Settings) => ipcRenderer.invoke('save-settings', settings),
  getStats: () => ipcRenderer.invoke('get-stats'),
  updateStats: (stats: Stats) => ipcRenderer.invoke('update-stats', stats),
  minimize: () => ipcRenderer.send('minimize-window'),
  close: () => ipcRenderer.send('close-window'),
  toggleCompactMode: () => {
    console.log('toggleCompactMode called from preload');
    ipcRenderer.send('toggle-compact-mode');
  },
  isCompactMode: () => ipcRenderer.invoke('is-compact-mode'),
  updateMenubarTimer: (timeRemaining: number, isRunning: boolean, totalTime: number) => 
    ipcRenderer.send('update-menubar-timer', timeRemaining, isRunning, totalTime)
};

contextBridge.exposeInMainWorld('api', api);
console.log('API exposed to main world:', api);