import { escapeHtml } from './api.js';

export function renderMapa(container, locais, opcoes = {}) {
  const { readOnly = false, missoes = [], onMove, onClick } = opcoes;
  container.innerHTML = '';

  locais.forEach((l) => {
    const node = document.createElement('div');
    node.className = 'map-node';
    node.style.left = l.x + '%';
    node.style.top = l.y + '%';

    const qtd = missoes.filter((m) => m.local_id === l.id).length;
    node.innerHTML =
      `<div class="node-dot st-${l.status}"></div>` +
      (qtd ? `<div class="node-badge">${qtd}</div>` : '') +
      `<div class="node-label">${escapeHtml(l.nome)}</div>`;

    if (readOnly) {
      node.style.cursor = 'default';
      node.addEventListener('click', () => { if (onClick) onClick(l); });
      container.appendChild(node);
      return;
    }

    let dragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;

    node.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      dragging = true;
      moved = false;
      startX = ev.clientX;
      startY = ev.clientY;
      node.classList.add('dragging');
      node.setPointerCapture(ev.pointerId);
    });

    node.addEventListener('pointermove', (ev) => {
      if (!dragging) return;
      if (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3) moved = true;
      if (!moved) return;

      const wrap = container.closest('.map-wrap') || container.parentElement;
      const rect = wrap.getBoundingClientRect();
      let x = ((ev.clientX - rect.left) / rect.width) * 100;
      let y = ((ev.clientY - rect.top) / rect.height) * 100;
      x = Math.max(4, Math.min(96, x));
      y = Math.max(6, Math.min(94, y));
      l.x = Math.round(x * 10) / 10;
      l.y = Math.round(y * 10) / 10;
      node.style.left = l.x + '%';
      node.style.top = l.y + '%';
    });

    const soltar = () => {
      if (!dragging) return;
      dragging = false;
      node.classList.remove('dragging');
      if (moved) { if (onMove) onMove(l); }
      else if (onClick) onClick(l);
    };

    node.addEventListener('pointerup', soltar);
    node.addEventListener('pointercancel', () => {
      dragging = false;
      node.classList.remove('dragging');
    });

    container.appendChild(node);
  });
}
