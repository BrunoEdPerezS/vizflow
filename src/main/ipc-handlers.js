const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

let getFilePath = null;
let getSelfSaving = null;
let setSelfSaving = null;

function registerIpcHandlers(mainWindow, getFp, getSf, setSf) {
  getFilePath = getFp;
  getSelfSaving = getSf;
  setSelfSaving = setSf;

  ipcMain.handle('file:read', async () => {
    const fp = getFilePath();
    if (!fp || !fs.existsSync(fp)) {
      return '';
    }
    return fs.readFileSync(fp, 'utf-8');
  });

  ipcMain.handle('file:save', async (_event, content) => {
    const fp = getFilePath();
    if (!fp) return { success: false, error: 'No file path' };
    try {
      setSelfSaving(true);
      fs.writeFileSync(fp, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('export:svg', async (_event, { svgContent, defaultName }) => {
    const fp = getFilePath();
    const basename = fp ? path.basename(fp, '.mmd') : 'diagram';
    const defaultPath = defaultName || `${basename}.svg`;

    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath,
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
    const fp = getFilePath();
    const basename = fp ? path.basename(fp, '.mmd') : 'diagram';
    const defaultPath = defaultName || `${basename}.png`;

    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath,
      filters: [{ name: 'PNG Files', extensions: ['png'] }]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    try {
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(result.filePath, buffer);
      return { success: true, path: result.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('get:filepath', async () => {
    return getFilePath();
  });
}

module.exports = { registerIpcHandlers };
