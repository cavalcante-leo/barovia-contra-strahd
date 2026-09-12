(function (CG) {
  'use strict';

  var TROPAS = CG.constants.TROPAS;
  var $ = CG.dom.$;
  var MAX_TROPAS = 10;

  function renderRecursos() {
    var state = CG.state.get();
    var total = CG.state.totalTropas();

    $('#rcRecursos').textContent = state.recursos;
    $('#rcMetais').textContent = state.metais;
    $('#rcInfluencia').textContent = state.influencia;
    $('#rcTropas').textContent = total;
    $('#cicloValor').textContent = state.ciclo;

    $('#sbTotal').textContent = total;
    $('#sbCap').textContent = total + '/10';
    $('#sbInf').textContent = state.influencia;
    $('#sbCiclo').textContent = state.ciclo;
  }

  function renderTropas() {
    var state = CG.state.get();
    var wrap = $('#tropasList');
    wrap.innerHTML = '';

    TROPAS.forEach(function (t) {
      var q = state.tropas[t.id] || 0;
      var card = document.createElement('div');
      card.className = 'troop-card ' + t.id;
      card.innerHTML =
        '<div class="troop-head">' +
          '<span class="troop-name">' + CG.dom.escapeHtml(t.nome) + '</span>' +
          '<span class="troop-count">' + q + '</span>' +
        '</div>' +
        '<p class="troop-desc">' + CG.dom.escapeHtml(t.desc) + '</p>' +
        '<div class="troop-foot">' +
          '<span class="meta">Disponíveis</span>' +
          '<div class="stepper">' +
            '<button ' + (q <= 0 ? 'disabled' : '') + ' data-t="' + t.id + '" data-d="-1">−</button>' +
            '<button ' + (CG.state.totalTropas() >= MAX_TROPAS ? 'disabled' : '') + ' data-t="' + t.id + '" data-d="1">+</button>' +
          '</div>' +
        '</div>';

      card.querySelectorAll('button').forEach(function (b) {
        b.onclick = function () {
          var state = CG.state.get();
          var d = Number(b.dataset.d);
          var cur = state.tropas[t.id] || 0;
          if (d > 0 && CG.state.totalTropas() >= MAX_TROPAS) return;
          state.tropas[t.id] = Math.max(0, cur + d);
          renderAll();
        };
      });

      wrap.appendChild(card);
    });
  }

  function renderAll() {
    renderRecursos();
    renderTropas();
    CG.state.save();
  }

  function init() {
    CG.topbar.init(renderAll);

    CG.dom.$$('[data-rec]').forEach(function (b) {
      b.onclick = function () {
        var state = CG.state.get();
        var k = b.dataset.rec;
        var d = Number(b.dataset.d);
        state[k] = Math.max(0, (state[k] || 0) + d);
        renderAll();
      };
    });

    $('#btnReset').onclick = function () {
      if (confirm('Reiniciar o Conselho de Guerra? Todos os dados salvos serão apagados.')) {
        CG.state.reset();
        renderAll();
      }
    };

    renderAll();
  }

  init();
})(window.CG);
