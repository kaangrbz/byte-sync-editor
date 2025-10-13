/**
 * ByteSync Editor - Preload Script
 * Electron için DevTools API'si
 */

const { contextBridge, ipcRenderer } = require('electron');

// Geliştirici modu bilgisini al
let isDeveloperMode = false;
ipcRenderer.on('dev-mode-info', (event, isDev) => {
    isDeveloperMode = isDev;
});

// DevTools API'sini window objesine ekle
contextBridge.exposeInMainWorld('electronAPI', {
    openDevTools: () => {
        ipcRenderer.send('open-devtools');
    },
    isDeveloperMode: () => {
        return isDeveloperMode;
    }
});

// DevTools açma isteği
ipcRenderer.on('devtools-opened', () => {
    console.log('DevTools açıldı');
});
