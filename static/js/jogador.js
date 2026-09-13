import { API, $, escapeHtml } from './api.js';
import { renderMapa } from './mapa.js';
import { renderMissoes } from './missoes.js';

const visao = { estado: null, tropas: [], aliados: [], locais: [], missoes: [] };

async function init() {
  const dados = await API.get('/api/public/estado');
  visao.estado = dados.estado;
  visao.tropas = dados.tropas;
  visao.aliados = dados.aliados;
  visao.locais = dados.locais;
  visao.missoes = await API.get('/api/public/missoes');

  const ciclo = $('#cicloValor');
  if (ciclo) ciclo.textContent = visao.estado.ciclo;

  renderMapa($('#mapNodes'), visao.locais, { readOnly: true, missoes: visao.missoes });
  renderMissoes($('#missoesList'), visao.missoes, { readOnly: true });

  const total = visao.tropas.reduce((a, t) => a + t.quantidade, 0);
  $('#rcMadeira').textContent = visao.estado.madeira;
  $('#rcPedra').textContent = visao.estado.pedra;
  $('#rcMetais').textContent = visao.estado.metais;
  $('#rcSuprimentos').textContent = visao.estado.suprimentos;
  $('#rcTropas').textContent = total;

  const wrap = $('#tropasList');
  wrap.innerHTML = '';
  visao.tropas.forEach((t) => {
    const card = document.createElement('div');
    card.className = 'troop-card ' + t.id;
    card.innerHTML =
      '<div class="troop-head">' +
        '<span class="troop-name">' + escapeHtml(t.nome) + '</span>' +
        '<span class="troop-count">' + t.quantidade + '</span>' +
      '</div>' +
      '<p class="troop-desc">' + escapeHtml(t.descricao) + '</p>';
    wrap.appendChild(card);
  });

  const aliadosWrap = $('#aliadosList');
  if (aliadosWrap) {
    aliadosWrap.innerHTML = '';
    visao.aliados.forEach((a) => {
      const card = document.createElement('div');
      card.className = 'aliado-card';
      card.innerHTML =
        '<div class="aliado-head">' +
          '<span class="aliado-nome">' + escapeHtml(a.nome) + '</span>' +
          '<span class="aliado-bonus">' + escapeHtml(a.bonus || '—') + '</span>' +
        '</div>' +
        '<p class="aliado-hab">' + escapeHtml(a.habilidade) + '</p>';
      aliadosWrap.appendChild(card);
    });
  }
}

init().catch((e) => console.error(e));
