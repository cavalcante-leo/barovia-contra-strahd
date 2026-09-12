(function (CG) {
  'use strict';

  var STATUS_LIST = CG.constants.STATUS_LIST;
  var $ = CG.dom.$;
  var escapeHtml = CG.dom.escapeHtml;

  function renderCiclo() {
    $('#cicloValor').textContent = CG.state.get().ciclo;
  }

  function renderResumo() {
    var state = CG.state.get();
    var hostis = state.faccoes.filter(function (f) {
      return f.status === 'Hostil' || f.status === 'Controlado';
    }).length;
    var espioes = state.faccoes.reduce(function (a, f) { return a + (f.espioes || 0); }, 0);
    var influencia = state.faccoes.reduce(function (a, f) { return a + (f.influencia || 0); }, 0);

    $('#sbTotal').textContent = state.faccoes.length;
    $('#sbHostis').textContent = hostis;
    $('#sbEspioes').textContent = espioes;
    $('#sbInfluencia').textContent = influencia;
  }

  function renderFaccoes() {
    var state = CG.state.get();
    var wrap = $('#faccoesList');
    wrap.innerHTML = '';

    if (!state.faccoes.length) {
      wrap.innerHTML = '<p class="empty">Nenhuma facção registrada.<br>Clique em + Nova Facção.</p>';
      return;
    }

    state.faccoes.forEach(function (f) {
      var card = document.createElement('div');
      card.className = 'faction-card s-' + f.status;
      var penVal = f.penalGlobal ? Math.min(f.espioes, f.capEspioes || 4) : 0;
      var statusOpts = STATUS_LIST.map(function (s) {
        return '<option ' + (s === f.status ? 'selected' : '') + '>' + s + '</option>';
      }).join('');

      card.innerHTML =
        '<div class="fc-head">' +
          '<strong>' + escapeHtml(f.nome) + '</strong>' +
          '<div class="fc-tools">' +
            '<button class="icon-btn edit" title="Editar">✎</button>' +
            '<button class="icon-btn del" title="Remover">✕</button>' +
          '</div>' +
        '</div>' +
        '<select class="fc-status">' + statusOpts + '</select>' +
        '<div class="fc-stat">' +
          '<span class="lbl">Espiões Ativos</span>' +
          '<div class="stepper">' +
            '<button data-k="espioes" data-d="-1">−</button>' +
            '<span class="val">' + (f.espioes || 0) + '</span>' +
            '<button data-k="espioes" data-d="1">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="fc-stat">' +
          '<span class="lbl">Tropas</span>' +
          '<div class="stepper">' +
            '<button data-k="tropas" data-d="-1">−</button>' +
            '<span class="val">' + (f.tropas || 0) + '</span>' +
            '<button data-k="tropas" data-d="1">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="fc-stat">' +
          '<span class="lbl">Influência Strahd</span>' +
          '<div class="stepper">' +
            '<button data-k="influencia" data-d="-1">−</button>' +
            '<span class="val">' + (f.influencia || 0) + '</span>' +
            '<button data-k="influencia" data-d="1">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="fc-stat">' +
          '<span class="lbl">Teto de Espiões</span>' +
          '<div class="stepper">' +
            '<button data-k="capEspioes" data-d="-1">−</button>' +
            '<span class="val">' + (f.capEspioes || 0) + '</span>' +
            '<button data-k="capEspioes" data-d="1">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="fc-foot">' +
          '<span>Penalidade Global</span>' +
          '<span class="pen-val ' + (penVal === 0 ? 'zero' : '') + '">+' + penVal + '</span>' +
        '</div>' +
        '<label class="fc-chk">' +
          '<input type="checkbox" class="chk-global" ' + (f.penalGlobal ? 'checked' : '') + '>' +
          'Aplicar penalidade de espiões em todas as missões' +
        '</label>';

      card.querySelector('.edit').onclick = function () { abrirFaccaoModal(f); };
      card.querySelector('.del').onclick = function () {
        if (confirm('Remover a facção "' + f.nome + '"?')) {
          var state = CG.state.get();
          state.faccoes = state.faccoes.filter(function (x) { return x.id !== f.id; });
          renderAll();
        }
      };
      card.querySelector('.fc-status').onchange = function (e) {
        f.status = e.target.value;
        renderAll();
      };
      card.querySelectorAll('.stepper button').forEach(function (b) {
        b.onclick = function () {
          var k = b.dataset.k;
          var d = Number(b.dataset.d);
          f[k] = Math.max(0, (f[k] || 0) + d);
          renderAll();
        };
      });
      card.querySelector('.chk-global').onchange = function (e) {
        f.penalGlobal = e.target.checked;
        renderAll();
      };

      wrap.appendChild(card);
    });
  }

  function renderAll() {
    renderCiclo();
    renderResumo();
    renderFaccoes();
    CG.state.save();
  }

  function abrirFaccaoModal(faccao) {
    var editando = !!faccao;
    var f = faccao || {
      id: CG.helpers.uid(),
      nome: '',
      status: 'Neutro',
      tropas: 0,
      espioes: 0,
      capEspioes: 4,
      influencia: 0,
      penalGlobal: true
    };

    $('#modalTitle').textContent = editando ? 'Editar Facção' : 'Nova Facção';
    $('#modalBody').innerHTML =
      '<div class="field">' +
        '<label>Nome da facção</label>' +
        '<input type="text" id="faNome" value="' + escapeHtml(f.nome) + '" placeholder="Ex.: Culto de Anastasya">' +
      '</div>' +
      '<div class="row2">' +
        '<div class="field">' +
          '<label>Status</label>' +
          '<select id="faStatus">' +
            STATUS_LIST.map(function (s) {
              return '<option ' + (s === f.status ? 'selected' : '') + '>' + s + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div class="field">' +
          '<label>Tropas ativas</label>' +
          '<input type="number" id="faTropas" value="' + (f.tropas || 0) + '" min="0">' +
        '</div>' +
      '</div>' +
      '<div class="row2">' +
        '<div class="field">' +
          '<label>Espiões ativos</label>' +
          '<input type="number" id="faEspioes" value="' + (f.espioes || 0) + '" min="0">' +
        '</div>' +
        '<div class="field">' +
          '<label>Teto de espiões</label>' +
          '<input type="number" id="faCap" value="' + (f.capEspioes || 0) + '" min="0">' +
        '</div>' +
      '</div>' +
      '<div class="field">' +
        '<label>Influência de Strahd</label>' +
        '<input type="number" id="faInf" value="' + (f.influencia || 0) + '" min="0">' +
      '</div>' +
      '<div class="field">' +
        '<label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:12px;color:var(--gray-4)">' +
          '<input type="checkbox" id="faPen" ' + (f.penalGlobal ? 'checked' : '') + ' style="width:14px;height:14px;accent-color:var(--teal-dark);margin:0">' +
          'Aplicar penalidade global de espiões' +
        '</label>' +
      '</div>' +
      '<div class="modal-foot">' +
        '<button class="btn btn-ghost" id="fCancelar">Cancelar</button>' +
        '<button class="btn btn-primary" id="fSalvar">' + (editando ? 'Salvar alterações' : 'Adicionar') + '</button>' +
      '</div>';

    $('#fCancelar').onclick = CG.modal.fechar;
    $('#fSalvar').onclick = function () {
      var nome = $('#faNome').value.trim();
      if (!nome) { alert('Dê um nome à facção.'); return; }

      f.nome        = nome;
      f.status      = $('#faStatus').value;
      f.tropas      = Number($('#faTropas').value) || 0;
      f.espioes     = Number($('#faEspioes').value) || 0;
      f.capEspioes  = Number($('#faCap').value) || 0;
      f.influencia  = Number($('#faInf').value) || 0;
      f.penalGlobal = $('#faPen').checked;

      if (!editando) CG.state.get().faccoes.push(f);
      CG.modal.fechar();
      renderAll();
    };

    CG.modal.abrir();
  }

  function init() {
    CG.modal.init();
    CG.topbar.init(renderAll);

    $('#btnNovaFaccao').onclick = function () { abrirFaccaoModal(null); };

    renderAll();
  }

  init();
})(window.CG);
