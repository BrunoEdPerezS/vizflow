(function () {
  var { ipcRenderer } = nodeRequire('electron');
  var { parseMmd } = nodeRequire('../shared/parser');
  var mermaid = nodeRequire('mermaid').default || nodeRequire('mermaid');

  var editor = null;
  var monaco = null;
  var saveTimeout = null;
  var isExternalUpdate = false;
  var currentTheme = 'dark';
  var currentFileBasename = 'diagram';

  function setTheme(theme) {
    currentTheme = theme;
    var root = document.documentElement;
    if (theme === 'dark') {
      root.classList.remove('theme-light');
    } else {
      root.classList.add('theme-light');
    }
  }

  function registerMermaidLanguage(monacoRef) {
    monacoRef.languages.register({ id: 'mermaid' });
    monacoRef.languages.setMonarchTokensProvider('mermaid', {
      keywords: [
        'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
        'erDiagram', 'journey', 'gantt', 'pie', 'gitgraph', 'mindmap', 'timeline',
        'quadrantChart', 'sankey', 'xychart', 'block', 'packet', 'architecture',
        'TD', 'TB', 'BT', 'RL', 'LR', 'participant', 'actor', 'loop', 'alt',
        'else', 'end', 'opt', 'par', 'and', 'rect', 'activate', 'deactivate',
        'Note', 'title', 'section', 'dateFormat', 'axisFormat', 'classDef', 'class',
        'style', 'linkStyle', 'click', 'call', 'subgraph'
      ],
      tokenizer: {
        root: [
          [/%%[#@]?.*$/, 'comment'],
          [/[A-Za-z][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
          [/-->|---|===|==>|-->/g, 'keyword'],
          [/\[.*?\]/, 'type'],
          [/\{.*?\}/, 'type'],
          [/\(.*?\)/, 'type'],
          [/".*?"/, 'string'],
          [/:.*$/, 'string']
        ]
      }
    });
    monacoRef.languages.setLanguageConfiguration('mermaid', {
      comments: { lineComment: '%%' },
      brackets: [['[', ']'], ['{', '}'], ['(', ')']],
      autoClosingPairs: [
        { open: '[', close: ']' }, { open: '{', close: '}' },
        { open: '(', close: ')' }, { open: '"', close: '"' }
      ]
    });
  }

  function initEditor(initialContent, theme, onChangeCallback) {
    return new Promise(function (resolve) {
      window.require(['vs/editor/editor.main'], function () {
        monaco = window.monaco;
        window.MonacoEnvironment = {
          getWorkerUrl: function () {
            return 'data:text/javascript;charset=utf-8,' + encodeURIComponent('self.onmessage=function(){};');
          }
        };
        registerMermaidLanguage(monaco);
        var editorTheme = theme === 'dark' ? 'vs-dark' : 'vs';
        editor = monaco.editor.create(document.getElementById('editor-container'), {
          value: initialContent,
          language: 'mermaid',
          theme: editorTheme,
          fontSize: 14,
          fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', 'Courier New', monospace",
          wordWrap: 'on',
          lineNumbers: 'on',
          minimap: { enabled: true },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          tabSize: 2,
          renderWhitespace: 'selection',
          bracketPairColorization: { enabled: true }
        });
        editor.onDidChangeModelContent(function () {
          if (isExternalUpdate) { isExternalUpdate = false; return; }
          if (onChangeCallback) { onChangeCallback(); }
          if (saveTimeout) { clearTimeout(saveTimeout); }
          saveTimeout = setTimeout(function () {
            ipcRenderer.invoke('file:save', editor.getValue());
          }, 500);
        });
        window.addEventListener('resize', function () { if (editor) editor.layout(); });
        resolve();
      });
    });
  }

  function getEditorContent() { return editor ? editor.getValue() : ''; }

  function setEditorContent(content) {
    if (!editor) return;
    isExternalUpdate = true;
    var pos = editor.getPosition();
    editor.setValue(content);
    if (pos) { try { editor.setPosition(pos); } catch (e) {} }
  }

  function updateEditorTheme(theme) {
    if (editor && monaco) {
      monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
    }
  }

  function renderDiagram(mermaidCode, theme) {
    var previewDiv = document.getElementById('mermaid-preview');
    var errorDiv = document.getElementById('preview-error');
    if (!mermaidCode || mermaidCode.trim() === '') {
      previewDiv.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">Type Mermaid syntax to render diagram...</p>';
      errorDiv.style.display = 'none';
      return;
    }
    mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: theme || 'dark' });
    var id = 'mermaid-svg-' + Date.now();
    mermaid.render(id, mermaidCode).then(function (r) {
      previewDiv.innerHTML = r.svg;
      errorDiv.style.display = 'none';
    }).catch(function (err) {
      previewDiv.innerHTML = '';
      errorDiv.style.display = 'block';
      errorDiv.textContent = err.message || 'Mermaid parse error';
    });
  }

  function renderAnnotations(annotations) {
    var overlay = document.getElementById('annotations-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    if (!annotations || annotations.length === 0) return;
    var baseTop = 10, baseLeft = 10, step = 40;
    annotations.forEach(function (text, i) {
      var note = document.createElement('div');
      note.className = 'sticky-note';
      note.textContent = text;
      note.style.top = (baseTop + i * step) + 'px';
      note.style.left = (baseLeft + i * 15) + 'px';
      overlay.appendChild(note);
    });
  }

  function getSvgWithAnnotations() {
    var svg = document.querySelector('#mermaid-preview svg');
    if (!svg) return null;
    var clone = svg.cloneNode(true);
    if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    try {
      var bbox = svg.getBBox();
      clone.setAttribute('width', Math.max(bbox.width + 40, 400));
      clone.setAttribute('height', Math.max(bbox.height + 40, 300));
    } catch (e) {
      clone.setAttribute('width', 800);
      clone.setAttribute('height', 600);
    }
    var notes = document.querySelectorAll('#annotations-overlay .sticky-note');
    notes.forEach(function (note) {
      var fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      fo.setAttribute('x', parseFloat(note.style.left) || 10);
      fo.setAttribute('y', parseFloat(note.style.top) || 10);
      fo.setAttribute('width', '260');
      fo.setAttribute('height', '100');
      var div = document.createElement('div');
      div.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
      div.style.cssText = 'background:rgba(180,160,80,0.25);color:#e8d888;padding:8px 14px;border-radius:6px;font-size:12px;font-style:italic;max-width:250px;word-wrap:break-word;line-height:1.4;';
      div.textContent = note.textContent;
      fo.appendChild(div);
      clone.appendChild(fo);
    });
    return new XMLSerializer().serializeToString(clone);
  }

  async function exportSvg(defaultName) {
    var svgContent = getSvgWithAnnotations();
    if (!svgContent) return;
    await ipcRenderer.invoke('export:svg', { svgContent: '<?xml version="1.0" encoding="UTF-8"?>\n' + svgContent, defaultName: defaultName + '.svg' });
  }

  async function exportPng(defaultName) {
    var svgContent = getSvgWithAnnotations();
    if (!svgContent) return;
    var canvas = document.createElement('canvas');
    var parser = new DOMParser();
    var svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    var el = svgDoc.documentElement;
    var w = parseInt(el.getAttribute('width')) || 800;
    var h = parseInt(el.getAttribute('height')) || 600;
    var scale = 2;
    canvas.width = w * scale;
    canvas.height = h * scale;
    var ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    var img = new Image();
    var blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    return new Promise(function (resolve, reject) {
      img.onload = async function () {
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        await ipcRenderer.invoke('export:png', { dataUrl: canvas.toDataURL('image/png'), defaultName: defaultName + '.png' });
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  async function handleContentChange() {
    var content = getEditorContent();
    var parsed = parseMmd(content);
    if (parsed.frontmatter && parsed.frontmatter.title) {
      document.getElementById('file-name').textContent = parsed.frontmatter.title;
    }
    renderDiagram(parsed.mermaidCode, currentTheme);
    renderAnnotations(parsed.annotations);
  }

  function checkThemeFromFm(fm) {
    if (fm && fm.theme && fm.theme !== currentTheme) {
      setTheme(fm.theme);
      updateEditorTheme(currentTheme);
    }
  }

  async function init() {
    var fp = await ipcRenderer.invoke('get:filepath');
    if (fp) {
      var parts = fp.replace(/\\/g, '/').split('/');
      currentFileBasename = parts[parts.length - 1].replace('.mmd', '');
      document.getElementById('file-name').textContent = currentFileBasename;
    }
    var content = await ipcRenderer.invoke('file:read');
    var parsed = parseMmd(content);
    setTheme((parsed.frontmatter && parsed.frontmatter.theme) || 'dark');
    if (parsed.frontmatter && parsed.frontmatter.title) {
      document.getElementById('file-name').textContent = parsed.frontmatter.title;
    }
    await initEditor(content, currentTheme, function () { handleContentChange(); });
    renderDiagram(parsed.mermaidCode, currentTheme);
    renderAnnotations(parsed.annotations);
    ipcRenderer.on('file:external-change', function (_e, newContent) {
      setEditorContent(newContent);
      var p = parseMmd(newContent);
      checkThemeFromFm(p.frontmatter);
      renderDiagram(p.mermaidCode, currentTheme);
      renderAnnotations(p.annotations);
    });
  }

  function start() {
    init();
    document.getElementById('btn-theme').addEventListener('click', function () {
      var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      updateEditorTheme(newTheme);
      var content = getEditorContent();
      var parsed = parseMmd(content);
      renderDiagram(parsed.mermaidCode, newTheme);
      renderAnnotations(parsed.annotations);
    });
    document.getElementById('btn-export-svg').addEventListener('click', function () { exportSvg(currentFileBasename); });
    document.getElementById('btn-export-png').addEventListener('click', function () { exportPng(currentFileBasename); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
