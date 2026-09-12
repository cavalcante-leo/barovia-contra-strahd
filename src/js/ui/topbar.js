(function (CG) {
  'use strict';

  var $ = CG.dom.$;

  function init(onRender) {
    $('#btnExport').onclick = function () {
      CG.io.exportState(CG.state.get());
    };

    $('#btnImport').onclick = function () {
      $('#fileImport').click();
    };

    $('#fileImport').onchange = function (e) {
      var file = e.target.files && e.target.files[0];
      if (file) CG.io.importState(file, onRender);
      e.target.value = '';
    };

    $('#cicloMais').onclick = function () {
      CG.state.get().ciclo++;
      onRender();
    };

    $('#cicloMenos').onclick = function () {
      var state = CG.state.get();
      state.ciclo = Math.max(1, state.ciclo - 1);
      onRender();
    };
  }

  CG.topbar = { init: init };
})(window.CG);
