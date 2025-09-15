/**
 * ByteSync Editor - Preload Script
 * Electron için DevTools API'si
 */

const { contextBridge, ipcRenderer } = require('electron');

// DevTools API'sini window objesine ekle
contextBridge.exposeInMainWorld('electronAPI', {
    openDevTools: () => {
        ipcRenderer.send('open-devtools');
    }
});

// DevTools açma isteği
ipcRenderer.on('devtools-opened', () => {
    console.log('DevTools açıldı');
});
