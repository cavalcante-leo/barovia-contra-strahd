(function (CG) {
  'use strict';

  var TIPOS = CG.constants.TIPOS;
  var DIFICULDADES = CG.constants.DIFICULDADES;
  var TROPAS = CG.constants.TROPAS;
  var ALIADOS = CG.constants.ALIADOS;
  var STATUS_LIST = CG.constants.STATUS_LIST;
  var uid = CG.helpers.uid;
  var statusClasse = CG.helpers.statusClasse;
  var $ = CG.dom.$;
  var $$ = CG.dom.$$;
  var escapeHtml = CG.dom.escapeHtml;

  function renderCiclo() {
    $('#cicloValor').textContent = CG.state.get().ciclo;
  }

  function renderMapa() {
    var state = CG.state.get();
    var layer = $('#mapNodes');
    layer.innerHTML = '';

    state.locais.forEach(function (l) {
      var node = document.createElement('div');
      node.className = 'map-node';
      node.style.left = l.x + '%';
      node.style.top = l.y + '%';

      var qtd = state.missoes.filter(function (m) { return m.localId === l.id; }).length;
      node.innerHTML =
        '<div class="node-dot ' + statusClasse(l.status) + '"></div>' +
        (qtd ? '<div class="node-badge">' + qtd + '</div>' : '') +
        '<div class="node-label">' + escapeHtml(l.nome) + '</div>';

      var dragging = false;
      var moved = false;
      var startX = 0;
      var startY = 0;

      node.addEventListener('pointerdown', function (ev) {
        ev.preventDefault();
        dragging = true;
        moved = false;
        startX = ev.clientX;
        startY = ev.clientY;
        node.classList.add('dragging');
        node.setPointerCapture(ev.pointerId);
      });

      node.addEventListener('pointermove', function (ev) {
        if (!dragging) return;
        if (Math.abs(ev.clientX - startX) > 3 || Math.abs(ev.clientY - startY) > 3) moved = true;
        if (!moved) return;

        var rect = $('#mapWrap').getBoundingClientRect();
        var x = ((ev.clientX - rect.left) / rect.width) * 100;
        var y = ((ev.clientY - rect.top) / rect.height) * 100;
        x = Math.max(4, Math.min(96, x));
        y = Math.max(6, Math.min(94, y));
        l.x = Math.round(x * 10) / 10;
        l.y = Math.round(y * 10) / 10;
        node.style.left = l.x + '%';
        node.style.top = l.y + '%';
      });

      var soltar = function () {
        if (!dragging) return;
        dragging = false;
        node.classList.remove('dragging');
        if (moved) CG.state.save();
        else abrirLocalModal(l);
      };

      node.addEventListener('pointerup', soltar);
      node.addEventListener('pointercancel', function () {
        dragging = false;
        node.classList.remove('dragging');
      });

      layer.appendChild(node);
    });
  }

  function renderMissoes() {
    var state = CG.state.get();
    var list = $('#missoesList');
    list.innerHTML = '';

    if (!state.missoes.length) {
      list.innerHTML = '<p class="empty">Nenhuma missão no quadro.<br>Clique em + Missão.</p>';
      return;
    }

    state.missoes.forEach(function (m) {
      list.appendChild(criarCardMissao(m));
    });
  }

  function criarCardMissao(m) {
    var state = CG.state.get();
    var c = CG.missao.calcMissao(state, m);
    var el = document.createElement('div');
    el.className = 'mission-mini tipo-' + m.tipo;

    var tropas = Object.keys(m.tropas || {}).filter(function (id) {
      return m.tropas[id] > 0;
    }).map(function (id) {
      var t = TROPAS.find(function (x) { return x.id === id; });
      return '<span class="chip">' + m.tropas[id] + 'x ' + escapeHtml(t ? t.nome : id) + '</span>';
    }).join('');

    var aliados = (m.aliados || []).map(function (id) {
      var a = ALIADOS.find(function (x) { return x.id === id; });
      return '<span class="chip">' + escapeHtml(a ? a.nome : id) + '</span>';
    }).join('');

    var penChips = c.pen.map(function (p) {
      return '<span class="chip pen">' + escapeHtml(p.txt) + ' ' + p.val + '</span>';
    }).join('');

    var bonChips = c.bon.map(function (b) {
      return '<span class="chip bonus">' + escapeHtml(b.txt) + ' ' + b.val + '</span>';
    }).join('');

    var aviso = '';
    if (c.bloqueado) aviso = '<div class="mm-warn">Ponto Hostil — bloqueado</div>';
    else if (c.desvantagem) aviso = '<div class="mm-warn">Desvantagem — 2d20 menor</div>';
    else if (c.vantagem) aviso = '<div class="mm-warn" style="color:var(--teal-mid)">Vantagem — 2d20 maior</div>';

    var resultHtml = '';
    if (m.resultado) {
      var r = m.resultado;
      resultHtml =
        '<div class="mm-result">' +
          '<span class="roll">' + escapeHtml(r.desc) + ' - total ' + r.total + ' vs DT ' + r.dt + '</span>' +
          '<span class="' + r.classe + '">' + escapeHtml(r.nivel) + '</span>' +
        '</div>';
    }

    el.innerHTML =
      '<div class="mm-head">' +
        '<span class="badge b-' + m.tipo + '">' + TIPOS[m.tipo] + '</span>' +
        '<div class="mm-tools">' +
          '<button class="icon-btn edit">✎</button>' +
          '<button class="icon-btn del">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="mm-title">' + escapeHtml(m.nome || 'Missão sem nome') + '</div>' +
      '<div class="mm-row">' +
        '<span class="loc">' + escapeHtml(c.local ? c.local.nome : 'sem local') + '</span>' +
        '<span class="status">' + escapeHtml(c.local ? c.local.status : '—') + '</span>' +
      '</div>' +
      '<div class="mm-dt-block">' +
        '<div>' +
          '<div class="lbl">DT Final</div>' +
          '<div class="num">' + c.dtFinal + '</div>' +
        '</div>' +
        '<div class="det">' +
          'base ' + c.dtBase +
          (c.globais ? ' +' + c.globais + ' esp' : '') +
          (c.especifico ? ' +' + c.especifico + ' cav' : '') +
          (c.localMod ? ' +' + c.localMod + ' loc' : '') +
          '<br>Teste: 1d20 +' + c.totalBonus +
        '</div>' +
      '</div>' +
      '<div class="mm-chips">' + tropas + aliados + '</div>' +
      '<div class="mm-chips">' + penChips + bonChips + '</div>' +
      aviso +
      resultHtml +
      '<div class="mm-actions">' +
        '<button class="btn btn-primary btn-rolar">Rolar Teste</button>' +
        '<button class="btn btn-clear">Limpar</button>' +
      '</div>';

    el.querySelector('.del').onclick = function () {
      if (confirm('Remover "' + m.nome + '"?')) {
        var state = CG.state.get();
        state.missoes = state.missoes.filter(function (x) { return x.id !== m.id; });
        renderAll();
      }
    };
    el.querySelector('.edit').onclick = function () { abrirMissaoModal(m); };
    el.querySelector('.btn-rolar').onclick = function () { rolarMissao(m.id); };
    el.querySelector('.btn-clear').onclick = function () { m.resultado = null; renderAll(); };

    return el;
  }

  function rolarMissao(id) {
    var m = CG.missao.rolarMissao(CG.state.get(), id);
    if (!m) return;
    renderAll();
  }

  function abrirMissaoModal(missao) {
    var state = CG.state.get();
    var m = missao || {
      id: uid(), nome: '', tipo: 'C',
      localId: state.locais[0] ? state.locais[0].id : '',
      dtBase: 15, tropas: {}, aliados: [], modManual: 0, notas: '', resultado: null
    };
    var editando = !!missao;

    var localOpts = state.locais.map(function (l) {
      return '<option value="' + l.id + '" ' + (l.id === m.localId ? 'selected' : '') + '>' +
        escapeHtml(l.nome) + ' — ' + escapeHtml(l.status) + '</option>';
    }).join('');

    var difOpts = DIFICULDADES.map(function (d) {
      return '<option value="' + d.dt + '" ' + (d.dt === m.dtBase ? 'selected' : '') + '>' +
        escapeHtml(d.nome) + ' (' + d.dt + ')</option>';
    }).join('');

    var tropasHtml = TROPAS.map(function (t) {
      var disp = state.tropas[t.id] || 0;
      var sel = (m.tropas || {})[t.id] || 0;
      return '<div class="pick-row ' + (disp ? '' : 'disabled') + '">' +
        '<input type="checkbox" data-troop="' + t.id + '" ' + (sel > 0 ? 'checked' : '') + ' ' + (disp ? '' : 'disabled') + '>' +
        '<span class="pname">' + escapeHtml(t.nome) + '</span>' +
        '<input type="number" class="qty" min="0" max="' + disp + '" value="' + (sel || (disp ? 1 : 0)) + '" data-qty="' + t.id + '" ' + (disp ? '' : 'disabled') + '>' +
        '<span class="pinfo">disp: ' + disp + '</span>' +
      '</div>';
    }).join('');

    var aliadosHtml = ALIADOS.map(function (a) {
      var sel = (m.aliados || []).indexOf(a.id) !== -1;
      var info = a.tipo === '-' ? '—' : '+' + a.bonus + ' ' + TIPOS[a.tipo];
      return '<div class="pick-row">' +
        '<input type="checkbox" data-ally="' + a.id + '" ' + (sel ? 'checked' : '') + '>' +
        '<span class="pname">' + escapeHtml(a.nome) + '</span>' +
        '<span class="pinfo">' + escapeHtml(info) + '</span>' +
      '</div>';
    }).join('');

    $('#modalTitle').textContent = editando ? 'Editar Missão' : 'Nova Missão';
    $('#modalBody').innerHTML =
      '<div class="field">' +
        '<label>Nome da missão</label>' +
        '<input type="text" id="fNome" value="' + escapeHtml(m.nome) + '" placeholder="Ex.: Libertar Vallaki">' +
      '</div>' +
      '<div class="row2">' +
        '<div class="field">' +
          '<label>Tipo</label>' +
          '<select id="fTipo">' +
            '<option value="B" ' + (m.tipo === 'B' ? 'selected' : '') + '>Busca</option>' +
            '<option value="R" ' + (m.tipo === 'R' ? 'selected' : '') + '>Reconhecimento</option>' +
            '<option value="C" ' + (m.tipo === 'C' ? 'selected' : '') + '>Controle</option>' +
          '</select>' +
        '</div>' +
        '<div class="field">' +
          '<label>Ponto de apoio</label>' +
          '<select id="fLocal">' + localOpts + '</select>' +
        '</div>' +
      '</div>' +
      '<div class="row2">' +
        '<div class="field">' +
          '<label>Dificuldade</label>' +
          '<select id="fDif">' + difOpts + '<option value="custom">Personalizada</option></select>' +
        '</div>' +
        '<div class="field">' +
          '<label>DT Base</label>' +
          '<input type="number" id="fDt" value="' + m.dtBase + '" min="1" max="40">' +
        '</div>' +
      '</div>' +
      '<fieldset><legend>Tropas alocadas</legend>' + tropasHtml + '</fieldset>' +
      '<fieldset><legend>Líderes / NPCs</legend>' + aliadosHtml + '</fieldset>' +
      '<div class="field">' +
        '<label>Modificador manual de DT (+/-)</label>' +
        '<input type="number" id="fMod" value="' + (m.modManual || 0) + '">' +
      '</div>' +
      '<div class="field">' +
        '<label>Notas / Consequências</label>' +
        '<textarea id="fNotas" placeholder="Ex.: sucesso reduz Influência de Strahd em Vallaki...">' + escapeHtml(m.notas) + '</textarea>' +
      '</div>' +
      '<div class="modal-foot">' +
        '<button class="btn btn-ghost" id="fCancelar">Cancelar</button>' +
        '<button class="btn btn-primary" id="fSalvar">' + (editando ? 'Salvar' : 'Adicionar') + '</button>' +
      '</div>';

    var selDif = $('#fDif');
    var inpDt = $('#fDt');
    selDif.onchange = function () { if (selDif.value !== 'custom') inpDt.value = selDif.value; };
    inpDt.oninput = function () {
      if (!DIFICULDADES.some(function (d) { return String(d.dt) === inpDt.value; })) selDif.value = 'custom';
    };

    $$('[data-troop]').forEach(function (chk) {
      var q = document.querySelector('[data-qty="' + chk.dataset.troop + '"]');
      chk.onchange = function () {
        q.disabled = !chk.checked;
        if (chk.checked && Number(q.value) === 0) q.value = 1;
      };
    });

    $('#fCancelar').onclick = CG.modal.fechar;
    $('#fSalvar').onclick = function () {
      var nome = $('#fNome').value.trim() || 'Missão sem nome';
      var tipo = $('#fTipo').value;
      var localId = $('#fLocal').value;
      var dtBase = Number($('#fDt').value) || 15;
      var modManual = Number($('#fMod').value) || 0;
      var notas = $('#fNotas').value.trim();

      var tropas = {};
      $$('[data-troop]').forEach(function (chk) {
        if (!chk.checked) return;
        var q = Number(document.querySelector('[data-qty="' + chk.dataset.troop + '"]').value) || 0;
        if (q > 0) tropas[chk.dataset.troop] = q;
      });

      var aliados = [];
      $$('[data-ally]').forEach(function (chk) {
        if (chk.checked) aliados.push(chk.dataset.ally);
      });

      Object.assign(m, { nome: nome, tipo: tipo, localId: localId, dtBase: dtBase,
        tropas: tropas, aliados: aliados, modManual: modManual, notas: notas });

      if (!editando) CG.state.get().missoes.push(m);
      CG.modal.fechar();
      renderAll();
    };

    CG.modal.abrir();
  }

  function abrirLocalModal(local) {
    var novo = !local;
    var l = local || { id: uid(), nome: '', status: 'Neutro', x: 50, y: 50 };

    $('#modalTitle').textContent = novo ? 'Novo Local' : 'Editar Local';
    $('#modalBody').innerHTML =
      '<div class="field">' +
        '<label>Nome do local</label>' +
        '<input type="text" id="loNome" value="' + escapeHtml(l.nome) + '" placeholder="Ex.: Ruínas de Berez">' +
      '</div>' +
      '<div class="field">' +
        '<label>Status</label>' +
        '<select id="loStatus">' + STATUS_LIST.map(function (s) {
          return '<option ' + (s === l.status ? 'selected' : '') + '>' + s + '</option>';
        }).join('') + '</select>' +
      '</div>' +
      '<div class="modal-foot">' +
        (novo ? '' : '<button class="btn btn-ghost" id="loDel" style="margin-right:auto;color:var(--coral)">Remover</button>') +
        '<button class="btn btn-ghost" id="fCancelar">Cancelar</button>' +
        '<button class="btn btn-primary" id="fSalvar">' + (novo ? 'Criar' : 'Salvar') + '</button>' +
      '</div>';

    $('#fCancelar').onclick = CG.modal.fechar;

    if (!novo) {
      $('#loDel').onclick = function () {
        if (confirm('Remover "' + l.nome + '"?')) {
          var state = CG.state.get();
          state.locais = state.locais.filter(function (x) { return x.id !== l.id; });
          CG.modal.fechar();
          renderAll();
        }
      };
    }

    $('#fSalvar').onclick = function () {
      l.nome = $('#loNome').value.trim() || 'Local sem nome';
      l.status = $('#loStatus').value;
      if (novo) CG.state.get().locais.push(l);
      CG.modal.fechar();
      renderAll();
    };

    CG.modal.abrir();
  }

  function renderAll() {
    renderCiclo();
    renderMapa();
    renderMissoes();
    CG.state.save();
  }

  function init() {
    CG.modal.init();
    CG.topbar.init(renderAll);

    $('#btnNovaMissao').onclick = function () { abrirMissaoModal(null); };
    $('#btnNovoLocal').onclick = function () { abrirLocalModal(null); };

    renderAll();
  }

  init();
})(window.CG);
