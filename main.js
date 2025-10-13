const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // Tarayıcı penceresi oluşturun.
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // index.html dosyasını yükleyin.
  mainWindow.loadFile('index.html');

  // Pencere hazır olduğunda DevTools'u aç
  mainWindow.on("ready-to-show", () => {
    // Geliştirici modu bilgisini renderer'a gönder
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
    
    // Sadece geliştirme ortamında DevTools'u aç
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
    
    mainWindow.webContents.send('dev-mode-info', isDev);
  });
}

// DevTools açma IPC handler
ipcMain.on('open-devtools', () => {
  if (mainWindow) {
    mainWindow.webContents.openDevTools();
  }
});

// Electron hazır olduğunda pencere oluşturun.
app.whenReady().then(createWindow);

// macOS için uygulama yaşam döngüsü yönetimi
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
