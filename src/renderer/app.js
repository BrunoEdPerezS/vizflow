(function () {
  var { ipcRenderer } = nodeRequire('electron');
  var { parseMmd } = nodeRequire('../shared/parser');
  var mermaid = nodeRequire('mermaid').default || nodeRequire('mermaid');

  var editor = null;
  var monaco = null;
  var currentTheme = 'dark';

  function Tab(filePath, content) {
    this.id = filePath;
    this.filePath = filePath;
    this._content = content;
    this.model = null;
    this.viewState = null;
    this.zoomScale = 1;
    this.fitScale = 1;
    this.zoomTx = 0;
    this.zoomTy = 0;
    this.saveTimeout = null;
    this.isExternalUpdate = false;
    this.parsed = parseMmd(content);
  }

  var TabManager = {
    tabs: {},
    _activeId: null,

    getActiveTab: function () {
      return this._activeId ? this.tabs[this._activeId] : null;
    },

    getActiveId: function () {
      return this._activeId;
    },

    getTabIds: function () {
      return Object.keys(this.tabs);
    },

    addTab: function (filePath, content) {
      if (this.tabs[filePath]) return this.tabs[filePath];
      var tab = new Tab(filePath, content);
      if (monaco) {
        tab.model = monaco.editor.createModel(content, 'mermaid');
        tab.model.updateOptions({ tabSize: 2 });
      }
      this.tabs[filePath] = tab;
      return tab;
    },

    removeTab: function (filePath) {
      var tab = this.tabs[filePath];
      if (!tab) return;
      if (tab.saveTimeout) { clearTimeout(tab.saveTimeout); }
      if (tab.model) { tab.model.dispose(); }
      delete this.tabs[filePath];
    },

    saveTabState: function () {
      var tab = this.getActiveTab();
      if (!tab) return;
      if (editor) {
        try { tab.viewState = editor.saveViewState(); } catch (e) {}
      }
      tab.zoomScale = zoomScale;
      tab.fitScale = fitScale;
      tab.zoomTx = zoomTx;
      tab.zoomTy = zoomTy;
    },

    switchTab: function (filePath) {
      var tab = this.tabs[filePath];
      if (!tab || filePath === this._activeId) return;
      this.saveTabState();
      this._activeId = filePath;
      this.restoreTabState(tab);
    },

    restoreTabState: function (tab) {
      if (!editor || !tab) return;
      editor.setModel(tab.model);
      if (tab.viewState) { try { editor.restoreViewState(tab.viewState); } catch (e) {} }
      zoomScale = tab.zoomScale;
      fitScale = tab.fitScale;
      zoomTx = tab.zoomTx;
      zoomTy = tab.zoomTy;
      applyZoom();
      currentFileBasename = tab.filePath.replace(/\\/g, '/').split('/').pop().replace('.mmd', '');
      document.getElementById('file-name').textContent = tab.parsed.frontmatter && tab.parsed.frontmatter.title ? tab.parsed.frontmatter.title : currentFileBasename;
      renderDiagram(tab.parsed.mermaidCode, currentTheme);
      renderAnnotations(tab.parsed.annotations);
      syncAnnotationFontSize();
      renderTabBar();
      if (tab.parsed.frontmatter && tab.parsed.frontmatter.theme && tab.parsed.frontmatter.theme !== currentTheme) {
        setTheme(tab.parsed.frontmatter.theme);
        updateEditorTheme(currentTheme);
      }
    }
  };

  var zoomScale = 1;
  var fitScale = 1;
  var zoomTx = 0;
  var zoomTy = 0;
  var isPanning = false;
  var panStartX = 0;
  var panStartY = 0;
  var panTx = 0;
  var panTy = 0;
  var currentFileBasename = 'diagram';

  function updateActiveTabParsed() {
    var tab = TabManager.getActiveTab();
    if (!tab) return;
    tab.parsed = parseMmd(tab.model ? tab.model.getValue() : '');
  }

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
          value: '',
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
          var tab = TabManager.getActiveTab();
          if (!tab) return;
          if (tab.isExternalUpdate) { tab.isExternalUpdate = false; return; }
          updateActiveTabParsed();
          if (onChangeCallback) { onChangeCallback(); }
          if (tab.saveTimeout) { clearTimeout(tab.saveTimeout); }
          tab.saveTimeout = setTimeout(function () {
            ipcRenderer.invoke('file:save', { filePath: tab.filePath, content: tab.model.getValue() });
          }, 500);
        });
        window.addEventListener('resize', function () { if (editor) editor.layout(); });
        resolve();
      });
    });
  }

  function getEditorContent() { return editor ? editor.getModel().getValue() : ''; }

  function setEditorContent(content) {
    if (!editor) return;
    var model = editor.getModel();
    if (!model) return;
    var tab = TabManager.getActiveTab();
    if (tab) { tab.isExternalUpdate = true; }
    var pos = editor.getPosition();
    model.setValue(content);
    if (pos) { try { editor.setPosition(pos); } catch (e) {} }
  }

  function updateEditorTheme(theme) {
    if (editor && monaco) {
      monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
    }
  }

  function applyZoom() {
    var stage = document.getElementById('preview-stage');
    if (!stage) return;
    var effectiveScale = zoomScale * fitScale;
    stage.style.transform = 'translate(' + zoomTx + 'px, ' + zoomTy + 'px) scale(' + effectiveScale + ')';
    document.getElementById('zoom-label').textContent = Math.round(zoomScale * 100) + '%';
  }

  function zoomStep(direction) {
    var container = document.getElementById('preview-container');
    if (!container) return;
    var cx = container.clientWidth / 2;
    var cy = container.clientHeight / 2;
    var factor = direction > 0 ? 1.2 : 1 / 1.2;
    var newScale = zoomScale * factor;
    newScale = Math.max(0.1, Math.min(5, newScale));
    var ratio = newScale / zoomScale;
    zoomTx = cx - ratio * (cx - zoomTx);
    zoomTy = cy - ratio * (cy - zoomTy);
    zoomScale = newScale;
    applyZoom();
  }

  function zoomToFit() {
    var container = document.getElementById('preview-container');
    var svg = document.querySelector('#mermaid-preview svg');
    var stage = document.getElementById('preview-stage');
    if (!container || !svg || !stage) return;

    var prevTransform = stage.style.transform;
    stage.style.transform = '';

    var rect = svg.getBoundingClientRect();
    var sw = rect.width;
    var sh = rect.height;

    if (!sw || !sh) {
      try {
        var vb = svg.viewBox.baseVal;
        sw = vb.width || 800;
        sh = vb.height || 600;
      } catch (e) {
        sw = 800;
        sh = 600;
      }
    }

    var cw = container.clientWidth;
    var ch = container.clientHeight;

    if (cw > 0 && ch > 0 && sw > 0 && sh > 0) {
      var pad = 40;
      var sx = (cw - pad) / sw;
      var sy = (ch - pad) / sh;
      fitScale = Math.max(sx, sy);
      zoomScale = 1;
      zoomTx = (cw - sw * fitScale * zoomScale) / 2;
      zoomTy = (ch - sh * fitScale * zoomScale) / 2;
    } else {
      fitScale = 1;
      zoomScale = 1;
      zoomTx = 0;
      zoomTy = 0;
    }
    applyZoom();
  }

  function resetZoom() {
    zoomScale = 1;
    zoomTx = 0;
    zoomTy = 0;
    applyZoom();
  }

  function syncAnnotationFontSize() {
    var overlay = document.getElementById('annotations-overlay');
    var svg = document.querySelector('#mermaid-preview svg');
    var svgText = svg ? svg.querySelector('text') : null;
    var stage = document.getElementById('preview-stage');
    if (!overlay || !svg || !stage) return;
    if (svgText) {
      var cssFontSize = parseFloat(window.getComputedStyle(svgText).fontSize);
      if (!cssFontSize) { overlay.style.removeProperty('--annotation-font-size'); return; }
      var prevTransform = stage.style.transform;
      stage.style.transform = '';
      var layoutWidth = svg.getBoundingClientRect().width;
      stage.style.transform = prevTransform;
      var vb = svg.viewBox.baseVal;
      if (vb.width && layoutWidth) {
        var visualFontSize = Math.round(cssFontSize * layoutWidth / vb.width);
        overlay.style.setProperty('--annotation-font-size', visualFontSize + 'px');
      } else {
        overlay.style.setProperty('--annotation-font-size', cssFontSize + 'px');
      }
    } else {
      overlay.style.removeProperty('--annotation-font-size');
    }
  }

  function renderDiagram(mermaidCode, theme, onAfterRender) {
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
      requestAnimationFrame(function () {
        syncAnnotationFontSize();
        if (onAfterRender) onAfterRender();
      });
    }).catch(function (err) {
      previewDiv.innerHTML = '';
      errorDiv.style.display = 'block';
      errorDiv.textContent = err.message || 'Mermaid parse error';
    });
  }

  function updateAnnotationLineInEditor(annotationIndex, x, y) {
    if (!editor) return;
    var tab = TabManager.getActiveTab();
    if (!tab) return;
    var content = tab.model.getValue();
    var lines = content.split('\n');
    var count = 0;
    for (var i = 0; i < lines.length; i++) {
      var trimmed = lines[i].trim();
      if (!trimmed.startsWith('%%#')) continue;
      if (count === annotationIndex) {
        var indent = lines[i].match(/^(\s*)/)[0];
        var raw = trimmed.replace(/^%%#\s*/, '');
        var textOnly = raw.replace(/\s*@-?\d+,-?\d+\s*/g, ' ').replace(/\s+/g, ' ').trim();
        lines[i] = indent + '%%# @' + Math.round(x) + ',' + Math.round(y) + ' ' + textOnly;
        break;
      }
      count++;
    }
    var newContent = lines.join('\n');
    tab.isExternalUpdate = true;
    tab.model.setValue(newContent);
    updateActiveTabParsed();
    if (tab.saveTimeout) { clearTimeout(tab.saveTimeout); }
    tab.saveTimeout = setTimeout(function () {
      ipcRenderer.invoke('file:save', { filePath: tab.filePath, content: newContent });
    }, 500);
    renderAnnotations(tab.parsed.annotations);
    syncAnnotationFontSize();
  }

  function renderAnnotations(annotations) {
    var overlay = document.getElementById('annotations-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    if (!annotations || annotations.length === 0) return;
    var baseTop = 10, baseLeft = 10, step = 40;
    var lastBottom = 0;

    annotations.forEach(function (ann, annIdx) {
      var note = document.createElement('div');
      note.className = 'sticky-note';
      note.textContent = ann.text;

      if (ann.x !== null && ann.y !== null) {
        note.style.left = ann.x + 'px';
        note.style.top = ann.y + 'px';
      } else {
        var top = Math.max(baseTop, lastBottom + 8);
        note.style.top = top + 'px';
        note.style.left = (baseLeft + annIdx * 15) + 'px';
        lastBottom = top + 24;
      }

      var dragStartX, dragStartY, noteStartLeft, noteStartTop;
      note.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        noteStartLeft = parseFloat(note.style.left) || 0;
        noteStartTop = parseFloat(note.style.top) || 0;
        note.classList.add('dragging');

        function onMove(me) {
          var dx = (me.clientX - dragStartX) / (zoomScale * fitScale);
          var dy = (me.clientY - dragStartY) / (zoomScale * fitScale);
          note.style.left = (noteStartLeft + dx) + 'px';
          note.style.top = (noteStartTop + dy) + 'px';
        }

        function onUp(ue) {
          note.classList.remove('dragging');
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
          var finalX = parseFloat(note.style.left) || 0;
          var finalY = parseFloat(note.style.top) || 0;
          updateAnnotationLineInEditor(annIdx, finalX, finalY);
        }

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      });

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
    var tab = TabManager.getActiveTab();
    if (!tab) return;
    var content = tab.model.getValue();
    var parsed = parseMmd(content);
    tab.parsed = parsed;
    if (parsed.frontmatter && parsed.frontmatter.title) {
      document.getElementById('file-name').textContent = parsed.frontmatter.title;
    } else {
      document.getElementById('file-name').textContent = tab.filePath.replace(/\\/g, '/').split('/').pop().replace('.mmd', '');
    }
    renderDiagram(parsed.mermaidCode, currentTheme);
    renderAnnotations(parsed.annotations);
    renderTabBar();
  }

  function checkThemeFromFm(fm) {
    if (fm && fm.theme && fm.theme !== currentTheme) {
      setTheme(fm.theme);
      updateEditorTheme(currentTheme);
    }
  }

  function renderTabBar() {
    var bar = document.getElementById('tab-bar');
    if (!bar) return;
    bar.innerHTML = '';
    var ids = TabManager.getTabIds();
    var activeId = TabManager.getActiveId();
    ids.forEach(function (id) {
      var tab = TabManager.tabs[id];
      var el = document.createElement('div');
      el.className = 'tab' + (id === activeId ? ' active' : '');
      el.setAttribute('data-tab-id', id);
      el.title = id;

      var label = document.createElement('span');
      label.className = 'tab-label';
      label.textContent = tab.filePath.replace(/\\/g, '/').split('/').pop();
      el.appendChild(label);

      var closeBtn = document.createElement('button');
      closeBtn.className = 'tab-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        ipcRenderer.invoke('file:save', { filePath: id, content: tab.model.getValue() });
        TabManager.removeTab(id);
        var remaining = TabManager.getTabIds();
        if (remaining.length > 0) {
          var nextId = remaining[0];
          TabManager.switchTab(nextId);
        }
        renderTabBar();
      });
      el.appendChild(closeBtn);

      el.addEventListener('click', function () {
        TabManager.switchTab(id);
      });

      bar.appendChild(el);
    });
  }

  function onTabsInit(_e, payload) {
    var tabs = payload.tabs;
    var activePath = payload.activeFilePath;

    tabs.forEach(function (t) {
      var tab = TabManager.addTab(t.filePath, t.content);
      if (t.filePath === activePath) {
        TabManager._activeId = t.filePath;
      }
    });

    if (!editor || !monaco) {
      var initCheck = setInterval(function () {
        if (editor && monaco) {
          clearInterval(initCheck);
          finishTabsInit();
        }
      }, 50);
      return;
    }
    finishTabsInit();

    function finishTabsInit() {
      var ids = TabManager.getTabIds();
      ids.forEach(function (id) {
        var t = TabManager.tabs[id];
        if (!t.model) {
          t.model = monaco.editor.createModel(t._content, 'mermaid');
          t.model.updateOptions({ tabSize: 2 });
        }
      });
      var activeTab = TabManager.getActiveTab();
      if (!activeTab) return;

      currentFileBasename = activeTab.filePath.replace(/\\/g, '/').split('/').pop().replace('.mmd', '');
      document.getElementById('file-name').textContent = activeTab.parsed.frontmatter && activeTab.parsed.frontmatter.title ? activeTab.parsed.frontmatter.title : currentFileBasename;
      setTheme((activeTab.parsed.frontmatter && activeTab.parsed.frontmatter.theme) || 'dark');

      editor.setModel(activeTab.model);
      renderDiagram(activeTab.parsed.mermaidCode, currentTheme, zoomToFit);
      renderAnnotations(activeTab.parsed.annotations);
      syncAnnotationFontSize();
      renderTabBar();
    }
  }

  function onTabOpen(_e, payload) {
    if (TabManager.tabs[payload.filePath]) {
      TabManager.switchTab(payload.filePath);
      return;
    }
    var tab = TabManager.addTab(payload.filePath, payload.content);
    TabManager.switchTab(payload.filePath);
    renderTabBar();
  }

  function onTabActivate(_e, payload) {
    TabManager.switchTab(payload.filePath);
  }

  function onTabRemoved(_e, payload) {
    if (payload.newActivePath) {
      TabManager.switchTab(payload.newActivePath);
    }
    renderTabBar();
  }

  function onFileExternalChange(_e, payload) {
    var filePath = payload.filePath;
    var content = payload.content;
    var tab = TabManager.tabs[filePath];
    if (!tab) return;

    tab.isExternalUpdate = true;
    tab.model.setValue(content);
    tab.parsed = parseMmd(content);

    if (TabManager.getActiveId() === filePath) {
      checkThemeFromFm(tab.parsed.frontmatter);
      renderDiagram(tab.parsed.mermaidCode, currentTheme);
      renderAnnotations(tab.parsed.annotations);
    }
  }

  function setupZoomPan() {
    var pane = document.getElementById('preview-pane');
    var stage = document.getElementById('preview-stage');

    pane.addEventListener('wheel', function (e) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      var rect = pane.getBoundingClientRect();
      var mx = e.clientX - rect.left;
      var my = e.clientY - rect.top;
      var factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      var newScale = zoomScale * factor;
      newScale = Math.max(0.1, Math.min(5, newScale));
      if (newScale === zoomScale) return;
      var ratio = newScale / zoomScale;
      zoomTx = mx - ratio * (mx - zoomTx);
      zoomTy = my - ratio * (my - zoomTy);
      zoomScale = newScale;
      applyZoom();
    }, { passive: false });

    stage.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panTx = zoomTx;
      panTy = zoomTy;
      stage.classList.add('panning');
      e.preventDefault();
    });

    window.addEventListener('mousemove', function (e) {
      if (!isPanning) return;
      zoomTx = panTx + (e.clientX - panStartX);
      zoomTy = panTy + (e.clientY - panStartY);
      applyZoom();
    });

    window.addEventListener('mouseup', function () {
      if (!isPanning) return;
      isPanning = false;
      var stage = document.getElementById('preview-stage');
      if (stage) stage.classList.remove('panning');
    });

    stage.addEventListener('dblclick', function () {
      resetZoom();
    });
  }

  function start() {
    ipcRenderer.on('tabs:init', onTabsInit);
    ipcRenderer.on('tab:open', onTabOpen);
    ipcRenderer.on('tab:activate', onTabActivate);
    ipcRenderer.on('tab:removed', onTabRemoved);
    ipcRenderer.on('file:external-change', onFileExternalChange);

    initEditor('', currentTheme, function () { handleContentChange(); }).then(function () {
      setupZoomPan();
    });

    window.addEventListener('keydown', function (e) {
      if (e.altKey && e.keyCode >= 49 && e.keyCode <= 57) {
        e.preventDefault();
        var idx = e.keyCode - 49;
        var ids = TabManager.getTabIds();
        if (idx < ids.length) {
          TabManager.switchTab(ids[idx]);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.keyCode === 87) {
        e.preventDefault();
        var activeId = TabManager.getActiveId();
        if (activeId && TabManager.getTabIds().length > 1) {
          var tab = TabManager.getActiveTab();
          ipcRenderer.invoke('file:save', { filePath: activeId, content: tab.model.getValue() });
          TabManager.removeTab(activeId);
          var remaining = TabManager.getTabIds();
          if (remaining.length > 0) {
            TabManager.switchTab(remaining[0]);
          }
          renderTabBar();
        }
      }
    });

    document.getElementById('btn-theme').addEventListener('click', function () {
      var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      updateEditorTheme(newTheme);
      var tab = TabManager.getActiveTab();
      if (!tab) return;
      updateActiveTabParsed();
      renderDiagram(tab.parsed.mermaidCode, newTheme);
      renderAnnotations(tab.parsed.annotations);
    });
    document.getElementById('btn-export-svg').addEventListener('click', function () { exportSvg(currentFileBasename); });
    document.getElementById('btn-export-png').addEventListener('click', function () { exportPng(currentFileBasename); });
    document.getElementById('btn-zoom-in').addEventListener('click', function () { zoomStep(1); });
    document.getElementById('btn-zoom-out').addEventListener('click', function () { zoomStep(-1); });
    document.getElementById('btn-zoom-fit').addEventListener('click', function () { zoomToFit(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
