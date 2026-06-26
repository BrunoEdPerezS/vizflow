const { ipcRenderer } = nodeRequire('electron');
const { parseMmd } = nodeRequire('../shared/parser');
const { initEditor, getEditorContent, setEditorContent, updateEditorTheme } = nodeRequire('./editor');
const { renderDiagram } = nodeRequire('./renderer');
const { renderAnnotations } = nodeRequire('./annotations');
const { exportSvg, exportPng } = nodeRequire('./export');

let currentTheme = 'dark';
let currentFileBasename = 'diagram';

function setTheme(theme) {
  currentTheme = theme;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.remove('theme-light');
  } else {
    root.classList.add('theme-light');
  }
}

async function handleContentChange() {
  const content = getEditorContent();
  const parsed = parseMmd(content);

  if (parsed.frontmatter && parsed.frontmatter.title) {
    document.getElementById('file-name').textContent = parsed.frontmatter.title;
  }

  renderDiagram(parsed.mermaidCode, currentTheme);
  renderAnnotations(parsed.annotations);
}

async function init() {
  const filePath = await ipcRenderer.invoke('get:filepath');
  if (filePath) {
    const parts = filePath.replace(/\\/g, '/').split('/');
    currentFileBasename = parts[parts.length - 1].replace('.mmd', '');
    document.getElementById('file-name').textContent = currentFileBasename;
  }

  const content = await ipcRenderer.invoke('file:read');
  const parsed = parseMmd(content);

  if (parsed.frontmatter && parsed.frontmatter.theme) {
    setTheme(parsed.frontmatter.theme);
  } else {
    setTheme('dark');
  }

  if (parsed.frontmatter && parsed.frontmatter.title) {
    document.getElementById('file-name').textContent = parsed.frontmatter.title;
  } else if (filePath) {
    const parts = filePath.replace(/\\/g, '/').split('/');
    currentFileBasename = parts[parts.length - 1].replace('.mmd', '');
    document.getElementById('file-name').textContent = currentFileBasename;
  }

  await initEditor(content, currentTheme, async () => {
    await handleContentChange();
  });

  renderDiagram(parsed.mermaidCode, currentTheme);
  renderAnnotations(parsed.annotations);

  ipcRenderer.on('file:external-change', (_event, newContent) => {
    setEditorContent(newContent);
    const p = parseMmd(newContent);
    checkThemeFromFrontmatter(p.frontmatter);
    renderDiagram(p.mermaidCode, currentTheme);
    renderAnnotations(p.annotations);
  });
}

function checkThemeFromFrontmatter(frontmatter) {
  if (frontmatter && frontmatter.theme && frontmatter.theme !== currentTheme) {
    setTheme(frontmatter.theme);
    updateEditorTheme(currentTheme);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init();

  document.getElementById('btn-theme').addEventListener('click', () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    updateEditorTheme(newTheme);
    const content = getEditorContent();
    const parsed = parseMmd(content);
    renderDiagram(parsed.mermaidCode, newTheme);
    renderAnnotations(parsed.annotations);
  });

  document.getElementById('btn-export-svg').addEventListener('click', () => {
    exportSvg(currentFileBasename);
  });

  document.getElementById('btn-export-png').addEventListener('click', () => {
    exportPng(currentFileBasename);
  });
});
