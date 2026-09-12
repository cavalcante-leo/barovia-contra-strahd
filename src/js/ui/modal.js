(function (CG) {
  'use strict';

  var $ = CG.dom.$;

  function abrir() {
    $('#modal').classList.add('open');
  }

  function fechar() {
    $('#modal').classList.remove('open');
  }

  function init() {
    $('#modalClose').onclick = fechar;
    $('#modal').addEventListener('click', function (e) {
      if (e.target.id === 'modal') fechar();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') fechar();
    });
  }

  CG.modal = { abrir: abrir, fechar: fechar, init: init };
})(window.CG);
