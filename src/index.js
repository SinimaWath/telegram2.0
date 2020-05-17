const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');
const path = require('path');

// Live Reload
require('electron-reload')(__dirname, {
  electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
  awaitWriteFinish: true
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

let window = null;

const createWindow = () => {
  // Create the browser window.
  window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  window.loadFile(path.join(__dirname, '../public/index.html'));
};

app.on('ready', createWindow);

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

ipcMain.on('connect', (event) => {
  // Тут код соединения с портом
  event.reply('connect-ok');
});

ipcMain.on('send', (event, {file}) => {
  console.log(file);
  // Тут код соединения с портом
  event.reply('send-ok');

  // дебаг
  setTimeout(() => {
    // Сообщение что тебе пришел файл
    window.webContents.send('file-get', { name: file.name });

    // Пытаемся сохранить файл
    ipcMain.on('save', (event, params) => {
      console.log(params, file.name);

      // Сохранили
      setTimeout(() => event.reply('save-ok'), 1000);
    })
  }, 2000);

});



