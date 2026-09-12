(function (CG) {
  'use strict';

  function exportState(state) {
    try {
      var dataStr = JSON.stringify(state, null, 2);
      var blob = new Blob([dataStr], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      var d = new Date();
      var ts = d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
      a.href = url;
      a.download = 'conselho-guerra-ciclo' + (state.ciclo || 1) + '-' + ts + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    } catch (e) {
      alert('Erro ao exportar: ' + e.message);
    }
  }

  function importState(file, onDone) {
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (!data || typeof data !== 'object') throw new Error('Arquivo JSON inválido.');
        if (!data.tropas && !data.faccoes && !data.locais && !data.missoes) {
          throw new Error('Estrutura não reconhecida como Conselho de Guerra.');
        }
        if (!confirm('Isso substituirá TODOS os dados atuais do conselho. Continuar?')) return;
        CG.state.set(data);
        if (typeof onDone === 'function') onDone();
        alert('Dados importados com sucesso!');
      } catch (err) {
        alert('Erro ao importar: ' + err.message);
      }
    };
    reader.onerror = function () { alert('Não foi possível ler o arquivo.'); };
    reader.readAsText(file);
  }

  CG.io = { exportState: exportState, importState: importState };
})(window.CG);
