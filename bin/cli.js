#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const fileArg = args.find(arg => arg.endsWith('.mmd')) || args[0];

if (!fileArg) {
  console.error('Usage: vizflow <file.mmd>');
  console.error('Please specify a .mmd file to open.');
  process.exit(1);
}

const filePath = path.resolve(fileArg);
const appRoot = path.resolve(__dirname, '..');
const electronPath = process.platform === 'win32'
  ? path.join(appRoot, 'node_modules', 'electron', 'dist', 'electron.exe')
  : path.join(appRoot, 'node_modules', 'electron', 'dist', 'electron');

if (!fs.existsSync(electronPath)) {
  console.error('Error: Electron not found. Run npm install first.');
  process.exit(1);
}

const child = spawn(electronPath, [appRoot, filePath], {
  stdio: 'inherit',
  shell: false,
  windowsHide: false
});

child.on('error', (err) => {
  console.error('Error launching Vizflow:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
