const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');
import {AppConnection} from "./network/app";
import path from "path";
import fs from "fs";

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

const conn = new AppConnection();

// подключение
ipcMain.on('connect', (event) => {
  const path = 'TODO';
  conn.accept(path).then(() => {
    return conn.connect();
  }).then(() => {
    event.reply('connect-ok');
    subscribeRecvFile();
  }).catch(() => {
    event.reply('connect-error');
  });
});

// прием
function subscribeRecvFile() {
  conn.recvFile().then((filename, buf) => {
    window.webContents.send('file-get', { name: filename });

    fs.writeFile(filename, buf, (err) => {
      window.webContents.send('save-ok');
    })
  });
}

// отправка
ipcMain.on('send', (event, {file}) => {
  console.log(file);

  file.arrayBuffer().then((buf) => {
    return conn.sendFile(file.name, buf);
  }).then(() => {
    event.reply('send-ok');
  }).catch(() => {
    event.reply('send-error');
  });
});



