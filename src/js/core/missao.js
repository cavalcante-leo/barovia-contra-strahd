(function (CG) {
  'use strict';

  var TROPAS = CG.constants.TROPAS;
  var ALIADOS = CG.constants.ALIADOS;
  var rnd = CG.helpers.rnd;

  function calcMissao(state, m) {
    var pen = [];
    var bon = [];
    var globais = 0;

    state.faccoes.forEach(function (f) {
      if (f.penalGlobal && f.espioes > 0) {
        var v = Math.min(f.espioes, f.capEspioes || 4);
        globais += v;
        pen.push({ txt: f.nome + ' (' + f.espioes + ' esp.)', val: '+' + v });
      }
    });

    var especifico = 0;
    if (m.tipo === 'C') {
      var cav = state.faccoes.find(function (f) { return f.id === 'cavaleiros'; });
      if (cav && cav.tropas > 0) {
        var vCav = Math.min(cav.tropas * 2, 6);
        especifico += vCav;
        pen.push({ txt: 'Cavaleiros (' + cav.tropas + ' tropas)', val: '+' + vCav });
      }
    }

    var local = state.locais.find(function (l) { return l.id === m.localId; });
    var localMod = 0;
    var vantagem = false;
    var desvantagem = false;
    var bloqueado = false;

    if (local) {
      if (local.status === 'Livre') {
        vantagem = true;
      } else if (local.status === 'Infiltrado' || local.status === 'Controlado') {
        desvantagem = true;
        localMod += 2;
        pen.push({ txt: local.status, val: '+2 - Desv.' });
      } else if (local.status === 'Hostil') {
        bloqueado = true;
        localMod += 5;
        pen.push({ txt: 'Hostil', val: '+5 - Bloq.' });
      }
    }

    var bonusAliados = 0;
    (m.aliados || []).forEach(function (id) {
      var a = ALIADOS.find(function (x) { return x.id === id; });
      if (!a || !a.bonus) return;
      if (a.tipo === m.tipo) {
        bonusAliados += a.bonus;
        bon.push({ txt: a.nome, val: '+' + a.bonus });
      } else {
        bon.push({ txt: a.nome + ' (fora)', val: '+0' });
      }
    });

    var bonusTropas = 0;
    Object.keys(m.tropas || {}).forEach(function (tid) {
      var qtd = m.tropas[tid];
      if (!qtd) return;
      var t = TROPAS.find(function (x) { return x.id === tid; });
      var b = 0;
      if (tid === 'matilha') b = qtd;
      else if (tid === 'mortosvivos') b = qtd;
      else if (tid === 'coletores' && m.tipo === 'B') b = qtd;
      else if (tid === 'dragoes' && m.tipo === 'C') b = qtd;
      else if (tid === 'pena' && m.tipo === 'R') b = qtd;
      if (b) {
        bonusTropas += b;
        bon.push({ txt: qtd + 'x ' + (t ? t.nome : tid), val: '+' + b });
      }
    });

    if ((m.aliados || []).indexOf('melissa') !== -1 && (m.tropas || {}).matilha > 0) {
      bonusTropas += 2;
      bon.push({ txt: 'Líder de Matilha', val: '+2' });
    }

    var manual = Number(m.modManual) || 0;
    var dtFinal = Number(m.dtBase || 0) + globais + especifico + localMod + manual;

    return {
      dtBase: Number(m.dtBase || 0), globais: globais, especifico: especifico,
      localMod: localMod, manual: manual, dtFinal: dtFinal,
      bonusAliados: bonusAliados, bonusTropas: bonusTropas,
      totalBonus: bonusAliados + bonusTropas,
      vantagem: vantagem, desvantagem: desvantagem, bloqueado: bloqueado,
      local: local, pen: pen, bon: bon
    };
  }

  function rolarMissao(state, id) {
    var m = state.missoes.find(function (x) { return x.id === id; });
    if (!m) return null;

    var c = calcMissao(state, m);
    var dado;
    var desc;

    if (c.vantagem) {
      var a1 = rnd(20);
      var a2 = rnd(20);
      dado = Math.max(a1, a2);
      desc = '2d20 [' + a1 + ',' + a2 + '] -> ' + dado + ' (vant.)';
    } else if (c.desvantagem) {
      var d1 = rnd(20);
      var d2 = rnd(20);
      dado = Math.min(d1, d2);
      desc = '2d20 [' + d1 + ',' + d2 + '] -> ' + dado + ' (desv.)';
    } else {
      dado = rnd(20);
      desc = '1d20 [' + dado + ']';
    }

    var total = dado + c.totalBonus;
    var dt = c.dtFinal;
    var nivel;
    var classe;

    if (total >= dt + 5)      { nivel = 'Sucesso Crítico';  classe = 'res-crit'; }
    else if (total >= dt)     { nivel = 'Sucesso';          classe = 'res-suc'; }
    else if (total >= dt - 3) { nivel = 'Sucesso Parcial';  classe = 'res-parc'; }
    else if (total >  dt - 5) { nivel = 'Fracasso';         classe = 'res-fail'; }
    else                      { nivel = 'Fracasso Crítico'; classe = 'res-critfail'; }

    m.resultado = { dado: dado, total: total, dt: dt, nivel: nivel, classe: classe, desc: desc };
    return m;
  }

  CG.missao = { calcMissao: calcMissao, rolarMissao: rolarMissao };
})(window.CG);
