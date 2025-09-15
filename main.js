const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // Tarayıcı penceresi oluşturun.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // index.html dosyasını yükleyin.
  mainWindow.loadFile('index.html');

  // DevTools'u açın (isteğe bağlı).
  // mainWindow.webContents.openDevTools();
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
