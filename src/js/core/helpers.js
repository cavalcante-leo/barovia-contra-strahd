(function (CG) {
  'use strict';

  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }

  function rnd(n) {
    return Math.floor(Math.random() * n) + 1;
  }

  function statusClasse(status) {
    return 'st-' + String(status || '').replace(/\s/g, '');
  }

  CG.helpers = { uid: uid, rnd: rnd, statusClasse: statusClasse };
})(window.CG);
