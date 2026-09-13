import { escapeHtml } from './api.js';

const TIPOS = { B: 'Busca', R: 'Reconhecimento', C: 'Controle' };

export function renderMissoes(container, missoes, opcoes = {}) {
  const { readOnly = false, onEditar, onExcluir } = opcoes;
  container.innerHTML = '';

  if (!missoes.length) {
    container.innerHTML = '<p class="empty">Nenhuma missão no quadro.</p>';
    return;
  }

  missoes.forEach((m) => container.appendChild(criarCard(m, { readOnly, onEditar, onExcluir })));
}

function criarCard(m, { readOnly, onEditar, onExcluir }) {
  const el = document.createElement('div');
  el.className = 'mission-mini tipo-' + m.tipo;

  const tropas = (m.tropas || [])
    .map((t) => `<span class="chip">${t.quantidade}x ${escapeHtml(t.nome)}</span>`)
    .join('');

  const aliados = (m.aliados || [])
    .map((a) => `<span class="chip">${escapeHtml(a.nome)}</span>`)
    .join('');

  const ferramentas = readOnly ? '' :
    '<div class="mm-tools">' +
      '<button class="icon-btn edit" title="Editar">✎</button>' +
      '<button class="icon-btn del" title="Remover">✕</button>' +
    '</div>';

  el.innerHTML =
    '<div class="mm-head">' +
      '<span class="badge b-' + m.tipo + '">' + TIPOS[m.tipo] + '</span>' +
      ferramentas +
    '</div>' +
    '<div class="mm-title">' + escapeHtml(m.nome || 'Missão sem nome') + '</div>' +
    '<div class="mm-row">' +
      '<span class="loc">' + escapeHtml(m.local || 'sem local') + '</span>' +
    '</div>' +
    '<div class="mm-dt-block">' +
      '<div>' +
        '<div class="lbl">DT</div>' +
        '<div class="num">' + m.dt + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="mm-chips">' + tropas + aliados + '</div>' +
    (m.notas ? '<div class="mm-notas">' + escapeHtml(m.notas) + '</div>' : '');

  if (!readOnly) {
    el.querySelector('.edit').onclick = () => onEditar && onEditar(m);
    el.querySelector('.del').onclick = () => onExcluir && onExcluir(m);
  }
  return el;
}
