const mermaid = nodeRequire('mermaid');

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'dark'
});

function renderDiagram(mermaidCode, theme) {
  const previewDiv = document.getElementById('mermaid-preview');
  const errorDiv = document.getElementById('preview-error');

  if (!mermaidCode || mermaidCode.trim() === '') {
    previewDiv.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">Type Mermaid syntax to render diagram...</p>';
    errorDiv.style.display = 'none';
    return;
  }

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: theme || 'dark'
  });

  const id = 'mermaid-svg-' + Date.now();

  mermaid.render(id, mermaidCode).then(({ svg }) => {
    previewDiv.innerHTML = svg;
    errorDiv.style.display = 'none';
  }).catch((err) => {
    previewDiv.innerHTML = '';
    errorDiv.style.display = 'block';
    errorDiv.textContent = err.message || 'Unknown Mermaid parse error';
  });
}

module.exports = { renderDiagram };
