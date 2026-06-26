const fs = require('fs');
const path = require('path');

let watcher = null;
let mainWindow = null;
let filePath = null;
let getSelfSaving = null;
let setSelfSaving = null;

function startWatcher(fp, mw, getSf, setSf) {
  filePath = path.resolve(fp);
  mainWindow = mw;
  getSelfSaving = getSf;
  setSelfSaving = setSf;

  watchFile();
}

function watchFile() {
  if (!filePath || !fs.existsSync(filePath)) return;

  try {
    watcher = fs.watch(filePath, (eventType) => {
      if (eventType === 'change') {
        if (getSelfSaving && getSelfSaving()) {
          return;
        }

        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('file:external-change', content);
          }
        } catch (err) {
          console.error('Error reading file on external change:', err.message);
        }
      } else if (eventType === 'rename') {
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            try {
              const content = fs.readFileSync(filePath, 'utf-8');
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('file:external-change', content);
              }
            } catch (err) {
              console.error('Error reading recreated file:', err.message);
            }
            watchFile();
          }
        }, 100);
      }
    });
  } catch (err) {
    console.error('Error setting up file watcher:', err.message);
  }
}

function stopWatcher() {
  if (watcher) {
    try {
      watcher.close();
    } catch (err) {
      console.error('Error closing watcher:', err.message);
    }
    watcher = null;
  }
}

module.exports = { startWatcher, stopWatcher };
