const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

let getActiveFilePath = null;
let getOpenFilePaths = null;
let getSelfSaving = null;
let setSelfSaving = null;

function registerIpcHandlers(mainWindow, getActiveFp, getOpenFps, getSf, setSf) {
  getActiveFilePath = getActiveFp;
  getOpenFilePaths = getOpenFps;
  getSelfSaving = getSf;
  setSelfSaving = setSf;

  ipcMain.handle('file:read', async (_event, data) => {
    var fp = (data && data.filePath) || getActiveFilePath();
    if (!fp || !fs.existsSync(fp)) return '';
    return fs.readFileSync(fp, 'utf-8');
  });

  ipcMain.handle('file:save', async (_event, payload) => {
    var fp = (payload && payload.filePath) || getActiveFilePath();
    if (!fp) return { success: false, error: 'No file path' };
    try {
      setSelfSaving(fp, true);
      fs.writeFileSync(fp, payload.content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('export:svg', async (_event, { svgContent, defaultName }) => {
    var fp = getActiveFilePath();
    var basename = fp ? path.basename(fp, '.mmd') : 'diagram';
    var defaultPath = defaultName || basename + '.svg';

    var result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultPath,
      filters: [{ name: 'SVG Files', extensions: ['svg'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    try {
      fs.writeFileSync(result.filePath, svgContent, 'utf-8');
      return { success: true, path: result.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('export:png', async (_event, { dataUrl, defaultName }) => {
    var fp = getActiveFilePath();
    var basename = fp ? path.basename(fp, '.mmd') : 'diagram';
    var defaultPath = defaultName || basename + '.png';

    var result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultPath,
      filters: [{ name: 'PNG Files', extensions: ['png'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    try {
      var base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      var buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(result.filePath, buffer);
      return { success: true, path: result.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('get:filepaths', async () => {
    return { filePaths: getOpenFilePaths(), activeFilePath: getActiveFilePath() };
  });
}

module.exports = { registerIpcHandlers };
