const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron');
const {AppConnection} = require("./network/app");
const path = require('path');
const fs = require('fs');
const {toArrayBuffer, toBuffer} = require("./helpers/buf");

// Live Reload
// require('electron-reload')(__dirname, {
//   electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
//   awaitWriteFinish: true
// });

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
ipcMain.on('connect', (event, {settings}) => {
  console.log(settings);
  conn.accept(settings.comport).then(() => {
    return conn.connect();
  }).then(() => {
    console.log('connect-ok');
    event.reply('connect-ok');
    subscribeRecvFile();
  }).catch((e) => {
    // NOTE: LOG
    console.log('connect-error');
    console.log(e.stack);
    event.reply('connect-error', e);
  });
});

// прием
function subscribeRecvFile() {
  conn.recvFile().then(({filename, filedata}) => {
    ipcMain.on('save', (evnt, data) => {
        console.log('FILE SAVE TO', data);

        filedata = toBuffer(filedata)

        fs.writeFile(data.path, filedata, (err) => {
            if (err) {
                window.webContents.send('save-error', err);
                return;
            }

            window.webContents.send('save-ok');
        })
    });

    window.webContents.send('file-get', { name: filename });

  });
}

// отправка
ipcMain.on('send', (event, {file}) => {

  fs.readFile(file.path, (err, data) => {
    if (err) {
      // NOTE: LOG
      event.reply('send-error');
      console.log(err.stack);
      return;
    }

    const buf = toArrayBuffer(data);
    console.log('before send');
    conn.sendFile(file.name, buf)
      .then(() => {
        console.log('send ok');
        event.reply('send-ok');
      }).catch(() => {
        event.reply('send-error', err);
      });
  });
});



