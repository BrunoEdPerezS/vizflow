const yaml = require('js-yaml');

function parseMmd(content) {
  if (!content || content.trim() === '') {
    return { frontmatter: {}, mermaidCode: '', annotations: [], annotationsAt: [], rawLines: [] };
  }

  const lines = content.split('\n');
  let frontmatter = {};
  let annotations = [];
  let annotationsAt = [];
  let mermaidLines = [];
  let inFrontmatter = false;
  let frontmatterStarted = false;
  let frontmatterEnded = false;
  let frontmatterLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!frontmatterStarted && line.trim() === '---' && i === 0) {
      frontmatterStarted = true;
      inFrontmatter = true;
      continue;
    }

    if (inFrontmatter && line.trim() === '---') {
      inFrontmatter = false;
      frontmatterEnded = true;
      try {
        frontmatter = yaml.load(frontmatterLines.join('\n')) || {};
      } catch (e) {
        frontmatter = {};
      }
      continue;
    }

    if (inFrontmatter) {
      frontmatterLines.push(line);
      continue;
    }

    if (line.trim().startsWith('%%#')) {
      annotations.push(line.trim().replace(/^%%#\s*/, ''));
      continue;
    }

    if (line.trim().startsWith('%%@')) {
      const atText = line.trim().replace(/^%%@\s*/, '');
      annotationsAt.push(atText);
      continue;
    }

    mermaidLines.push(line);
  }

  const mermaidCode = mermaidLines.join('\n').trim();

  return { frontmatter, mermaidCode, annotations, annotationsAt };
}

module.exports = { parseMmd };
