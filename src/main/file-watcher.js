const fs = require('fs');
const path = require('path');

let watchers = {};
let mainWindow = null;

function addWatcher(filePath, mw, getSelfSaving, setSelfSaving) {
  var fp = path.resolve(filePath);
  mainWindow = mw;

  if (watchers[fp]) {
    try { watchers[fp].close(); } catch (e) {}
  }

  if (!fs.existsSync(fp)) return;

  try {
    watchers[fp] = fs.watch(fp, function (eventType) {
      if (eventType === 'change') {
        if (getSelfSaving && getSelfSaving()) return;

        try {
          var content = fs.readFileSync(fp, 'utf-8');
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('file:external-change', { filePath: fp, content: content });
          }
        } catch (err) {
          console.error('Error reading file on external change:', err.message);
        }
      } else if (eventType === 'rename') {
        setTimeout(function () {
          if (fs.existsSync(fp)) {
            try {
              var content = fs.readFileSync(fp, 'utf-8');
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('file:external-change', { filePath: fp, content: content });
              }
            } catch (err) {
              console.error('Error reading recreated file:', err.message);
            }
            addWatcher(fp, mainWindow, getSelfSaving, setSelfSaving);
          }
        }, 100);
      }
    });
  } catch (err) {
    console.error('Error setting up file watcher:', err.message);
  }
}

function removeWatcher(filePath) {
  var fp = path.resolve(filePath);
  if (watchers[fp]) {
    try {
      watchers[fp].close();
    } catch (err) {
      console.error('Error closing watcher:', err.message);
    }
    delete watchers[fp];
  }
}

function stopAllWatchers() {
  Object.keys(watchers).forEach(function (fp) {
    try {
      watchers[fp].close();
    } catch (err) {
      console.error('Error closing watcher:', err.message);
    }
  });
  watchers = {};
}

module.exports = { addWatcher, removeWatcher, stopAllWatchers };
