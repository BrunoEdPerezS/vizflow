const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { registerIpcHandlers } = require('./ipc-handlers');
const { addWatcher, removeWatcher, stopAllWatchers } = require('./file-watcher');

let mainWindow = null;
let openFiles = {};
let activeFilePath = null;

function getActiveFilePath() {
  return activeFilePath;
}

function getOpenFilePaths() {
  return Object.keys(openFiles);
}

function getSelfSaving(fp) {
  var entry = openFiles[fp];
  return entry ? entry.selfSaving : false;
}

function setSelfSaving(fp, val) {
  var entry = openFiles[fp];
  if (!entry) return;
  entry.selfSaving = val;
  if (entry.selfSavingTimer) { clearTimeout(entry.selfSavingTimer); entry.selfSavingTimer = null; }
  if (val) {
    entry.selfSavingTimer = setTimeout(function () {
      entry.selfSaving = false;
      entry.selfSavingTimer = null;
    }, 500);
  }
}

function updateWindowTitle() {
  if (mainWindow) {
    var basename = activeFilePath ? path.basename(activeFilePath) : 'untitled.mmd';
    mainWindow.setTitle('Vizflow - ' + basename);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    center: true,
    title: 'Vizflow',
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

async function openFileDialog() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Abrir diagrama',
    filters: [{ name: 'Mermaid Diagrams', extensions: ['mmd'] }],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
}

function addFileToOpen(newPath) {
  const resolved = path.resolve(newPath);

  if (!fs.existsSync(resolved)) {
    fs.writeFileSync(resolved, getDefaultTemplate(), 'utf-8');
  }

  if (openFiles[resolved]) {
    activeFilePath = resolved;
    updateWindowTitle();
    mainWindow.webContents.send('tab:activate', { filePath: resolved });
    return;
  }

  openFiles[resolved] = { selfSaving: false, selfSavingTimer: null };
  activeFilePath = resolved;
  updateWindowTitle();

  addWatcher(resolved, mainWindow, function () { return getSelfSaving(resolved); }, function (v) { setSelfSaving(resolved, v); });

  const content = fs.readFileSync(resolved, 'utf-8');
  mainWindow.webContents.send('tab:open', { filePath: resolved, content });
}

function closeFile(targetPath) {
  if (!openFiles[targetPath]) return;

  removeWatcher(targetPath);

  var timer = openFiles[targetPath].selfSavingTimer;
  if (timer) clearTimeout(timer);
  delete openFiles[targetPath];

  if (targetPath === activeFilePath) {
    var remaining = Object.keys(openFiles);
    if (remaining.length > 0) {
      activeFilePath = remaining[0];
      updateWindowTitle();
      mainWindow.webContents.send('tab:removed', { removedPath: targetPath, newActivePath: activeFilePath });
    } else {
      activeFilePath = null;
      updateWindowTitle();
    }
  } else {
    mainWindow.webContents.send('tab:removed', { removedPath: targetPath, newActivePath: activeFilePath });
  }
}

function buildMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Abrir...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const newPath = await openFileDialog();
            if (newPath) addFileToOpen(newPath);
          }
        },
        { type: 'separator' },
        {
          label: 'Cerrar pestaña',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            if (activeFilePath) closeFile(activeFilePath);
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          role: 'quit'
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  const args = process.argv.slice(1);
  const mmdFiles = [];

  for (const arg of args) {
    if (arg.endsWith('.mmd')) {
      mmdFiles.push(path.resolve(arg));
    }
  }

  if (mmdFiles.length === 0 && args.length > 1 && !args[args.length - 1].startsWith('--') && !args[args.length - 1].startsWith('-')) {
    mmdFiles.push(path.resolve(args[args.length - 1]));
  }

  if (mmdFiles.length === 0) {
    mmdFiles.push(path.join(app.getPath('temp'), 'untitled.mmd'));
  }

  mmdFiles.forEach(function (fp) {
    if (!fs.existsSync(fp)) {
      fs.writeFileSync(fp, getDefaultTemplate(), 'utf-8');
    }
    openFiles[fp] = { selfSaving: false, selfSavingTimer: null };
    addWatcher(fp, mainWindow, function () { return getSelfSaving(fp); }, function (v) { setSelfSaving(fp, v); });
  });

  activeFilePath = mmdFiles[0];

  createWindow();
  buildMenu();
  updateWindowTitle();
  registerIpcHandlers(mainWindow, getActiveFilePath, getOpenFilePaths, getSelfSaving, setSelfSaving);

  mainWindow.webContents.on('did-finish-load', () => {
    var payloads = mmdFiles.map(function (fp) {
      return { filePath: fp, content: fs.readFileSync(fp, 'utf-8') };
    });
    mainWindow.webContents.send('tabs:init', { tabs: payloads, activeFilePath: activeFilePath });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopAllWatchers();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopAllWatchers();
});
