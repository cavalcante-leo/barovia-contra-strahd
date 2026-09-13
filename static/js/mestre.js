import { API, $, $$, escapeHtml } from './api.js';
import { renderMapa } from './mapa.js';
import { renderMissoes } from './missoes.js';

const visao = { estado: null, tropas: [], aliados: [], locais: [], missoes: [] };
const STATUS_LIST = ['Livre', 'Neutro', 'Hostil'];

async function carregar() {
  const dados = await API.get('/api/public/estado');
  visao.estado = dados.estado;
  visao.tropas = dados.tropas;
  visao.aliados = dados.aliados;
  visao.locais = dados.locais;
  visao.missoes = await API.get('/api/public/missoes');
}

const totalTropas = () => visao.tropas.reduce((a, t) => a + t.quantidade, 0);

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
function renderCiclo() {
  const el = $('#cicloValor');
  if (el) el.textContent = visao.estado.ciclo;
}

function renderRecursos() {
  const e = visao.estado;
  $('#rcMadeira').textContent = e.madeira;
  $('#rcPedra').textContent = e.pedra;
  $('#rcMetais').textContent = e.metais;
  $('#rcSuprimentos').textContent = e.suprimentos;
  $('#rcTropas').textContent = totalTropas();
}

function renderTropas() {
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
      '<p class="troop-desc">' + escapeHtml(t.descricao) + '</p>' +
      '<div class="troop-foot">' +
        '<div class="stepper">' +
          '<button ' + (t.quantidade <= 0 ? 'disabled' : '') + ' data-t="' + t.id + '" data-d="-1">−</button>' +
          '<button data-t="' + t.id + '" data-d="1">+</button>' +
        '</div>' +
        '<div class="fc-tools">' +
          '<button class="icon-btn edit" title="Editar">✎</button>' +
          '<button class="icon-btn del" title="Remover">✕</button>' +
        '</div>' +
      '</div>';

    card.querySelectorAll('.stepper button').forEach((b) => {
      b.onclick = async () => {
        const novo = Math.max(0, t.quantidade + Number(b.dataset.d));
        await API.put(`/api/master/tropas/${t.id}`, { quantidade: novo });
        await recarregar();
      };
    });
    card.querySelector('.edit').onclick = () => abrirTropaModal(t);
    card.querySelector('.del').onclick = async () => {
      if (!confirm(`Remover a tropa "${t.nome}"?`)) return;
      try {
        await API.del(`/api/master/tropas/${t.id}`);
        await recarregar();
      } catch (e) { alert(e.message); }
    };
    wrap.appendChild(card);
  });
}

function renderMapaPainel() {
  renderMapa($('#mapNodes'), visao.locais, {
    missoes: visao.missoes,
    onMove: async (l) => { await API.put(`/api/master/locais/${l.id}`, { x: l.x, y: l.y }); },
    onClick: abrirLocalModal,
  });
}

function renderMissoesLista() {
  renderMissoes($('#missoesList'), visao.missoes, {
    onEditar: abrirMissaoModal,
    onExcluir: async (m) => {
      if (!confirm(`Remover "${m.nome}"?`)) return;
      await API.del(`/api/master/missoes/${m.id}`);
      await recarregar();
    },
  });
}

function renderTudo() {
  renderCiclo();
  renderMapaPainel();
  renderMissoesLista();
  renderTropas();
  renderAliados();
  renderRecursos();
}

function renderAliados() {
  const wrap = $('#aliadosList');
  if (!wrap) return;
  wrap.innerHTML = '';
  visao.aliados.forEach((a) => {
    const card = document.createElement('div');
    card.className = 'aliado-card';
    card.innerHTML =
      '<div class="aliado-head">' +
        '<span class="aliado-nome">' + escapeHtml(a.nome) + '</span>' +
        '<span class="aliado-bonus">' + escapeHtml(a.bonus || '—') + '</span>' +
        '<div class="fc-tools">' +
          '<button class="icon-btn edit" title="Editar">✎</button>' +
          '<button class="icon-btn del" title="Remover">✕</button>' +
        '</div>' +
      '</div>' +
      '<p class="aliado-hab">' + escapeHtml(a.habilidade) + '</p>';

    card.querySelector('.edit').onclick = () => abrirAliadoModal(a);
    card.querySelector('.del').onclick = async () => {
      if (!confirm(`Remover o aliado "${a.nome}"?`)) return;
      await API.del(`/api/master/aliados/${a.id}`);
      await recarregar();
    };
    wrap.appendChild(card);
  });
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
function abrirModal() { $('#modal').classList.add('open'); }
function fecharModal() { $('#modal').classList.remove('open'); }

function initModalGlobal() {
  $('#modalClose').onclick = fecharModal;
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') fecharModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });
}

function abrirLocalModal(local) {
  const novo = !local;
  const l = local || { id: null, nome: '', status: 'Neutro' };

  $('#modalTitle').textContent = novo ? 'Novo Local' : 'Editar Local';
  $('#modalBody').innerHTML =
    '<div class="field"><label>Nome do local</label>' +
      '<input type="text" id="loNome" value="' + escapeHtml(l.nome) + '" placeholder="Ex.: Ruínas de Berez"></div>' +
    '<div class="field"><label>Status</label><select id="loStatus">' +
      STATUS_LIST.map((s) => '<option ' + (s === l.status ? 'selected' : '') + '>' + s + '</option>').join('') +
    '</select></div>' +
    '<div class="modal-foot">' +
      (novo ? '' : '<button class="btn btn-ghost" id="loDel" style="margin-right:auto;color:var(--coral)">Remover</button>') +
      '<button class="btn btn-ghost" id="fCancelar">Cancelar</button>' +
      '<button class="btn btn-primary" id="fSalvar">' + (novo ? 'Criar' : 'Salvar') + '</button>' +
    '</div>';

  $('#fCancelar').onclick = fecharModal;
  if (!novo) {
    $('#loDel').onclick = async () => {
      if (!confirm(`Remover "${l.nome}"?`)) return;
      await API.del(`/api/master/locais/${l.id}`);
      fecharModal();
      await recarregar();
    };
  }
  $('#fSalvar').onclick = async () => {
    const corpo = {
      nome: $('#loNome').value.trim() || 'Local sem nome',
      status: $('#loStatus').value,
    };
    if (novo) await API.post('/api/master/locais', corpo);
    else await API.put(`/api/master/locais/${l.id}`, corpo);
    fecharModal();
    await recarregar();
  };
  abrirModal();
}

function abrirTropaModal(tropa) {
  const editando = !!tropa;
  const t = tropa || { id: null, nome: '', descricao: '', quantidade: 0 };

  $('#modalTitle').textContent = editando ? 'Editar Tropa' : 'Nova Tropa';
  $('#modalBody').innerHTML =
    '<div class="field"><label>Nome da tropa</label>' +
      '<input type="text" id="trNome" value="' + escapeHtml(t.nome) + '"></div>' +
    '<div class="field"><label>Descrição</label>' +
      '<textarea id="trDesc">' + escapeHtml(t.descricao) + '</textarea></div>' +
    '<div class="field"><label>Quantidade</label>' +
      '<input type="number" id="trQtd" min="0" value="' + (t.quantidade || 0) + '"></div>' +
    '<div class="modal-foot">' +
      '<button class="btn btn-ghost" id="fCancelar">Cancelar</button>' +
      '<button class="btn btn-primary" id="fSalvar">' + (editando ? 'Salvar' : 'Adicionar') + '</button>' +
    '</div>';

  $('#fCancelar').onclick = fecharModal;
  $('#fSalvar').onclick = async () => {
    const corpo = {
      nome: $('#trNome').value.trim() || 'Tropa sem nome',
      descricao: $('#trDesc').value.trim(),
      quantidade: Number($('#trQtd').value) || 0,
    };
    if (editando) await API.put(`/api/master/tropas/${tropa.id}`, corpo);
    else await API.post('/api/master/tropas', corpo);
    fecharModal();
    await recarregar();
  };
  abrirModal();
}

function abrirAliadoModal(aliado) {
  const editando = !!aliado;
  const a = aliado || { id: null, nome: '', bonus: '', habilidade: '' };

  $('#modalTitle').textContent = editando ? 'Editar Aliado' : 'Novo Aliado';
  $('#modalBody').innerHTML =
    '<div class="field"><label>Nome</label>' +
      '<input type="text" id="alNome" value="' + escapeHtml(a.nome) + '" placeholder="Ex.: Van Richten"></div>' +
    '<div class="field"><label>Bônus</label>' +
      '<input type="text" id="alBonus" value="' + escapeHtml(a.bonus) + '" placeholder="Ex.: +2 em Reconhecimento"></div>' +
    '<div class="field"><label>Habilidade</label>' +
      '<textarea id="alHab" placeholder="Descrição da habilidade...">' + escapeHtml(a.habilidade) + '</textarea></div>' +
    '<div class="modal-foot">' +
      '<button class="btn btn-ghost" id="fCancelar">Cancelar</button>' +
      '<button class="btn btn-primary" id="fSalvar">' + (editando ? 'Salvar' : 'Adicionar') + '</button>' +
    '</div>';

  $('#fCancelar').onclick = fecharModal;
  $('#fSalvar').onclick = async () => {
    const corpo = {
      nome: $('#alNome').value.trim() || 'Aliado sem nome',
      bonus: $('#alBonus').value.trim(),
      habilidade: $('#alHab').value.trim(),
    };
    if (editando) await API.put(`/api/master/aliados/${aliado.id}`, corpo);
    else await API.post('/api/master/aliados', corpo);
    fecharModal();
    await recarregar();
  };
  abrirModal();
}

function abrirMissaoModal(missao) {
  const editando = !!missao;
  const m = missao || {
    id: null, nome: '', tipo: 'C',
    local_id: visao.locais[0] ? visao.locais[0].id : '',
    dt: 10, notas: '', tropas: [],
  };

  const tropasSel = {};
  (m.tropas || []).forEach((t) => { tropasSel[t.id] = t.quantidade; });
  const aliadosSel = new Set((m.aliados || []).map((a) => a.id));

  const localOpts = visao.locais.map((l) =>
    '<option value="' + l.id + '" ' + (l.id === m.local_id ? 'selected' : '') + '>' +
    escapeHtml(l.nome) + ' — ' + l.status + '</option>').join('');

  const tropasHtml = visao.tropas.map((t) => {
    const sel = tropasSel[t.id] || 0;
    const disp = t.quantidade + sel;
    return '<div class="pick-row ' + (disp ? '' : 'disabled') + '">' +
      '<input type="checkbox" data-troop="' + t.id + '" ' + (sel > 0 ? 'checked' : '') + ' ' + (disp ? '' : 'disabled') + '>' +
      '<span class="pname">' + escapeHtml(t.nome) + '</span>' +
      '<input type="number" class="qty" min="0" max="' + disp + '" value="' + (sel || (disp ? 1 : 0)) + '" data-qty="' + t.id + '" ' + (disp ? '' : 'disabled') + '>' +
      '<span class="pinfo">disp: ' + disp + '</span>' +
    '</div>';
  }).join('');

  const aliadosHtml = visao.aliados.map((a) =>
    '<div class="pick-row">' +
      '<input type="checkbox" data-ally="' + a.id + '" ' + (aliadosSel.has(a.id) ? 'checked' : '') + '>' +
      '<span class="pname">' + escapeHtml(a.nome) + '</span>' +
      '<span class="pinfo">' + escapeHtml(a.bonus || '—') + '</span>' +
    '</div>').join('');

  $('#modalTitle').textContent = editando ? 'Editar Missão' : 'Nova Missão';
  $('#modalBody').innerHTML =
    '<div class="field"><label>Nome da missão</label>' +
      '<input type="text" id="fNome" value="' + escapeHtml(m.nome) + '" placeholder="Ex.: Libertar Vallaki"></div>' +
    '<div class="row2">' +
      '<div class="field"><label>Tipo</label><select id="fTipo">' +
        '<option value="B" ' + (m.tipo === 'B' ? 'selected' : '') + '>Busca</option>' +
        '<option value="R" ' + (m.tipo === 'R' ? 'selected' : '') + '>Reconhecimento</option>' +
        '<option value="C" ' + (m.tipo === 'C' ? 'selected' : '') + '>Controle</option>' +
      '</select></div>' +
      '<div class="field"><label>Ponto de apoio</label><select id="fLocal">' + localOpts + '</select></div>' +
    '</div>' +
    '<div class="field"><label>DT (Dificuldade Total)</label>' +
      '<input type="number" id="fDt" value="' + m.dt + '" min="1" max="40"></div>' +
    '<fieldset><legend>Tropas alocadas</legend>' + tropasHtml + '</fieldset>' +
    '<fieldset><legend>Aliados</legend>' + (aliadosHtml || '<p class="empty">Nenhum aliado cadastrado.</p>') + '</fieldset>' +
    '<div class="field"><label>Notas / Consequências</label>' +
      '<textarea id="fNotas">' + escapeHtml(m.notas) + '</textarea></div>' +
    '<div class="modal-foot">' +
      '<button class="btn btn-ghost" id="fCancelar">Cancelar</button>' +
      '<button class="btn btn-primary" id="fSalvar">' + (editando ? 'Salvar' : 'Adicionar') + '</button>' +
    '</div>';

  $$('[data-troop]').forEach((chk) => {
    const q = document.querySelector(`[data-qty="${chk.dataset.troop}"]`);
    chk.onchange = () => {
      q.disabled = !chk.checked;
      if (chk.checked && Number(q.value) === 0) q.value = 1;
    };
  });

  $('#fCancelar').onclick = fecharModal;
  $('#fSalvar').onclick = async () => {
    const tropas = {};
    $$('[data-troop]').forEach((chk) => {
      if (!chk.checked) return;
      const q = Number(document.querySelector(`[data-qty="${chk.dataset.troop}"]`).value) || 0;
      if (q > 0) tropas[chk.dataset.troop] = q;
    });
    const aliados = $$('[data-ally]').filter((c) => c.checked).map((c) => c.dataset.ally);
    const corpo = {
      nome: $('#fNome').value.trim() || 'Missão sem nome',
      tipo: $('#fTipo').value,
      local_id: $('#fLocal').value || null,
      dt: Number($('#fDt').value) || 10,
      notas: $('#fNotas').value.trim(),
      tropas,
      aliados,
    };
    try {
      if (editando) await API.put(`/api/master/missoes/${missao.id}`, corpo);
      else await API.post('/api/master/missoes', corpo);
      fecharModal();
      await recarregar();
    } catch (e) { alert(e.message); }
  };
  abrirModal();
}

// ---------------------------------------------------------------------------
// Topbar
// ---------------------------------------------------------------------------
function initTopbar(recarregar) {
  $('#cicloMais').onclick = async () => {
    await API.post('/api/master/estado', { ciclo: visao.estado.ciclo + 1 });
    await recarregar();
  };
  $('#cicloMenos').onclick = async () => {
    await API.post('/api/master/estado', { ciclo: Math.max(1, visao.estado.ciclo - 1) });
    await recarregar();
  };
  $('#btnExport').onclick = async () => {
    const dados = await API.get('/api/master/export');
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const d = new Date();
    const ts = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
    const a = document.createElement('a');
    a.href = url;
    a.download = `conselho-guerra-ciclo${dados.estado.ciclo || 1}-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $('#btnLogout').onclick = async () => {
    await API.post('/api/auth/logout');
    location.href = '/mestre/login';
  };
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
async function recarregar() {
  await carregar();
  renderTudo();
}

async function init() {
  await recarregar();

  $('#btnNovaMissao').onclick = () => abrirMissaoModal(null);
  $('#btnNovoLocal').onclick = () => abrirLocalModal(null);
  $('#btnNovaTropa').onclick = () => abrirTropaModal(null);
  $('#btnNovoAliado').onclick = () => abrirAliadoModal(null);
  $$('[data-rec]').forEach((b) => {
    b.onclick = async () => {
      const k = b.dataset.rec;
      const d = Number(b.dataset.d);
      await API.post('/api/master/estado', { [k]: Math.max(0, (visao.estado[k] || 0) + d) });
      await recarregar();
    };
  });

  initModalGlobal();
  initTopbar(recarregar);
}

init().catch((e) => {
  if (e.status === 401) location.href = '/mestre/login';
  else alert(e.message);
});
