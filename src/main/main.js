const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { registerIpcHandlers } = require('./ipc-handlers');
const { startWatcher, stopWatcher } = require('./file-watcher');

let mainWindow = null;
let filePath = null;
let selfSaving = false;

function getFilePath() {
  return filePath;
}

function getSelfSaving() {
  return selfSaving;
}

function setSelfSaving(val) {
  selfSaving = val;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    center: true,
    title: 'Mermaid Live',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function getDefaultTemplate() {
  const templatePath = path.join(__dirname, '..', 'shared', 'default.mmd');
  return fs.readFileSync(templatePath, 'utf-8');
}

app.whenReady().then(() => {
  const args = process.argv.slice(1);
  let mmdArg = null;

  for (const arg of args) {
    if (arg.endsWith('.mmd')) {
      mmdArg = arg;
      break;
    }
  }

  if (!mmdArg && args.length > 1 && !args[args.length - 1].startsWith('--') && !args[args.length - 1].startsWith('-')) {
    mmdArg = args[args.length - 1];
  }

  if (mmdArg) {
    filePath = path.resolve(mmdArg);
  }

  if (!filePath) {
    const { dialog } = require('electron');
    dialog.showErrorBox('Usage', 'mermaid-live <file.mmd>\n\nPlease specify a .mmd file to open.');
    app.quit();
    return;
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, getDefaultTemplate(), 'utf-8');
  }

  createWindow();
  registerIpcHandlers(mainWindow, () => filePath, () => selfSaving, (v) => { selfSaving = v; });

  mainWindow.webContents.on('did-finish-load', () => {
    startWatcher(filePath, mainWindow, () => selfSaving, (v) => { selfSaving = v; });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopWatcher();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopWatcher();
});
