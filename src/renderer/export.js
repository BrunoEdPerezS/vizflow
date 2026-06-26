const { ipcRenderer } = nodeRequire('electron');
const { parseMmd } = nodeRequire('../shared/parser');
const { getEditorContent } = nodeRequire('./editor');

function getSvgWithAnnotations() {
  const previewSvg = document.querySelector('#mermaid-preview svg');
  const stickyNotes = document.querySelectorAll('#annotations-overlay .sticky-note');

  if (!previewSvg) {
    return null;
  }

  const svgClone = previewSvg.cloneNode(true);

  if (!svgClone.getAttribute('xmlns')) {
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }

  const bbox = previewSvg.getBBox ? previewSvg.getBBox() : { width: 800, height: 600 };
  const svgWidth = Math.max(bbox.width + 40, 400);
  const svgHeight = Math.max(bbox.height + 40, 300);

  svgClone.setAttribute('width', svgWidth);
  svgClone.setAttribute('height', svgHeight);

  stickyNotes.forEach((note) => {
    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    const top = parseFloat(note.style.top) || 10;
    const left = parseFloat(note.style.left) || 10;
    foreignObject.setAttribute('x', left);
    foreignObject.setAttribute('y', top);
    foreignObject.setAttribute('width', '260');
    foreignObject.setAttribute('height', '100');

    const div = document.createElement('div');
    div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    div.style.cssText = `
      background: rgba(180,160,80,0.25);
      color: #e8d888;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-style: italic;
      font-family: 'Segoe UI', sans-serif;
      max-width: 250px;
      word-wrap: break-word;
      line-height: 1.4;
      backdrop-filter: blur(4px);
    `;
    div.textContent = note.textContent;

    foreignObject.appendChild(div);
    svgClone.appendChild(foreignObject);
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgClone);
}

async function exportSvg(defaultName) {
  const svgContent = getSvgWithAnnotations();
  if (!svgContent) return;

  const svgStr = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgContent;
  await ipcRenderer.invoke('export:svg', { svgContent: svgStr, defaultName: defaultName + '.svg' });
}

async function exportPng(defaultName) {
  const svgContent = getSvgWithAnnotations();
  if (!svgContent) return;

  const canvas = document.createElement('canvas');
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;

  const width = parseInt(svgElement.getAttribute('width')) || 800;
  const height = parseInt(svgElement.getAttribute('height')) || 600;
  const scale = 2;

  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const img = new Image();
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    img.onload = async () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/png');
      await ipcRenderer.invoke('export:png', { dataUrl, defaultName: defaultName + '.png' });
      resolve();
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

module.exports = { exportSvg, exportPng };
