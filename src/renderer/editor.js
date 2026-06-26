const { ipcRenderer } = nodeRequire('electron');

let editor = null;
let monaco = null;
let saveTimeout = null;
let isExternalUpdate = false;

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
        [/[A-Za-z][\w$]*/, {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier'
          }
        }],
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
      { open: '[', close: ']' },
      { open: '{', close: '}' },
      { open: '(', close: ')' },
      { open: '"', close: '"' }
    ]
  });
}

function initEditor(initialContent, theme, onChangeCallback) {
  return new Promise((resolve) => {
    window.require(['vs/editor/editor.main'], function () {
      monaco = window.monaco;

      window.MonacoEnvironment = {
        getWorkerUrl: function () {
          return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(
            'self.onmessage = function() {};'
          );
        }
      };

      registerMermaidLanguage(monaco);

      const editorTheme = theme === 'dark' ? 'vs-dark' : 'vs';

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

      editor.onDidChangeModelContent(() => {
        if (isExternalUpdate) {
          isExternalUpdate = false;
          return;
        }

        if (onChangeCallback) {
          onChangeCallback();
        }

        if (saveTimeout) {
          clearTimeout(saveTimeout);
        }

        saveTimeout = setTimeout(() => {
          ipcRenderer.invoke('file:save', editor.getValue());
        }, 500);
      });

      window.addEventListener('resize', () => {
        if (editor) {
          editor.layout();
        }
      });

      resolve();
    });
  });
}

function getEditorContent() {
  return editor ? editor.getValue() : '';
}

function setEditorContent(content) {
  if (editor) {
    isExternalUpdate = true;
    const position = editor.getPosition();
    editor.setValue(content);
    if (position) {
      try {
        editor.setPosition(position);
      } catch (e) {}
    }
  }
}

function updateEditorTheme(theme) {
  if (editor && monaco) {
    const editorTheme = theme === 'dark' ? 'vs-dark' : 'vs';
    monaco.editor.setTheme(editorTheme);
  }
}

module.exports = { initEditor, getEditorContent, setEditorContent, updateEditorTheme };
