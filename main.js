const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

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

// File dialog handler
ipcMain.handle('show-open-dialog', async (event, options) => {
  // Get last folder from userData
  const userDataPath = app.getPath('userData');
  const lastFolderPath = path.join(userDataPath, 'last-ptp-folder.json');
  
  let defaultPath = null;
  try {
    if (fs.existsSync(lastFolderPath)) {
      const lastFolderData = JSON.parse(fs.readFileSync(lastFolderPath, 'utf8'));
      if (lastFolderData.folder && fs.existsSync(lastFolderData.folder)) {
        defaultPath = lastFolderData.folder;
      }
    }
  } catch (error) {
    console.error('Error reading last folder:', error);
  }
  
  const dialogOptions = {
    ...options,
    defaultPath: defaultPath || undefined
  };
  
  const result = await dialog.showOpenDialog(mainWindow, dialogOptions);
  
  // Save last folder if file was selected
  if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
    const selectedFile = result.filePaths[0];
    const selectedFolder = path.dirname(selectedFile);
    
    try {
      fs.writeFileSync(lastFolderPath, JSON.stringify({ folder: selectedFolder }), 'utf8');
    } catch (error) {
      console.error('Error saving last folder:', error);
    }
    
    // Read file content and add to result
    try {
      const fileContent = fs.readFileSync(selectedFile, 'utf8');
      const fileName = path.basename(selectedFile);
      result.fileContent = fileContent;
      result.fileName = fileName;
    } catch (error) {
      console.error('Error reading file:', error);
      result.error = error.message;
    }
  }
  
  return result;
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
