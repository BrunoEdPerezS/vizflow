function renderAnnotations(annotations) {
  const overlay = document.getElementById('annotations-overlay');
  if (!overlay) return;

  overlay.innerHTML = '';

  if (!annotations || annotations.length === 0) return;

  const baseTop = 10;
  const baseLeft = 10;
  const offsetStep = 40;

  annotations.forEach((text, index) => {
    const note = document.createElement('div');
    note.className = 'sticky-note';
    note.textContent = text;
    note.style.top = (baseTop + index * offsetStep) + 'px';
    note.style.left = (baseLeft + index * 15) + 'px';
    overlay.appendChild(note);
  });
}

module.exports = { renderAnnotations };
