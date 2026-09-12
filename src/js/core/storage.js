(function (CG) {
  'use strict';

  var KEY = CG.constants.STORAGE_KEY;

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function write(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* armazenamento indisponível */ }
  }

  function clear() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) { /* armazenamento indisponível */ }
  }

  CG.storage = { read: read, write: write, clear: clear };
})(window.CG);
