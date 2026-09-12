(function (CG) {
  'use strict';

  var uid = CG.helpers.uid;

  function estadoPadrao() {
    return {
      ciclo: 1, recursos: 4, metais: 2, influencia: 3,
      tropas: { matilha: 1, mortosvivos: 0, coletores: 0, dragoes: 1, pena: 1 },
      faccoes: [
        { id: 'karsten',    nome: 'Casa Karsten',             status: 'Hostil',     espioes: 2, capEspioes: 4, tropas: 2, influencia: 3, penalGlobal: true },
        { id: 'andrej',     nome: 'Andrej (Vila de Baróvia)', status: 'Infiltrado', espioes: 1, capEspioes: 3, tropas: 1, influencia: 2, penalGlobal: true },
        { id: 'cavaleiros', nome: 'Cavaleiros do Silvado',    status: 'Hostil',     espioes: 0, capEspioes: 0, tropas: 3, influencia: 4, penalGlobal: false },
        { id: 'karmilla',   nome: 'Karmilla (Vallaki)',       status: 'Hostil',     espioes: 1, capEspioes: 2, tropas: 2, influencia: 3, penalGlobal: false },
        { id: 'stone',      nome: 'Família Stone (Vallaki)',  status: 'Neutro',     espioes: 0, capEspioes: 0, tropas: 2, influencia: 2, penalGlobal: false },
        { id: 'matilha-f',  nome: 'A Matilha',                status: 'Neutro',     espioes: 0, capEspioes: 0, tropas: 2, influencia: 1, penalGlobal: false },
        { id: 'vistani',    nome: 'Os Vistani',               status: 'Neutro',     espioes: 0, capEspioes: 0, tropas: 1, influencia: 0, penalGlobal: false },
        { id: 'krezk-f',    nome: 'Fortaleza de Krezk',       status: 'Livre',      espioes: 0, capEspioes: 0, tropas: 2, influencia: 0, penalGlobal: false }
      ],
      locais: [
        { id: 'krezk',     nome: 'Krezk',           status: 'Livre',      x: 8,  y: 22 },
        { id: 'vallaki',   nome: 'Vallaki',         status: 'Controlado', x: 42, y: 25 },
        { id: 'vistani1',  nome: 'Vistani',         status: 'Neutro',     x: 42, y: 34 },
        { id: 'vinhedo',   nome: 'Vinhedo',         status: 'Livre',      x: 9,  y: 44 },
        { id: 'danhez',    nome: 'Danhez',          status: 'Neutro',     x: 8,  y: 62 },
        { id: 'silvado',   nome: 'Silvado',         status: 'Hostil',     x: 32, y: 58 },
        { id: 'berez',     nome: 'Berez',           status: 'Hostil',     x: 24, y: 80 },
        { id: 'ravenloft', nome: 'Ravenloft',       status: 'Hostil',     x: 82, y: 40 },
        { id: 'vistani2',  nome: 'Vistani',         status: 'Neutro',     x: 65, y: 58 },
        { id: 'barovia',   nome: 'Vila de Baróvia', status: 'Infiltrado', x: 88, y: 58 },
        { id: 'karstein',  nome: 'Karstein',        status: 'Hostil',     x: 84, y: 8 }
      ],
      missoes: [
        { id: uid(), nome: 'Assegurar rota de comércio', tipo: 'C', localId: 'vallaki',
          dtBase: 15, tropas: { dragoes: 1 }, aliados: ['marius'], modManual: 0,
          notas: 'Sucesso reduz DT de Busca nos arredores.', resultado: null },
        { id: uid(), nome: 'Reunião no vinhedo antes do anoitecer', tipo: 'R', localId: 'vinhedo',
          dtBase: 10, tropas: {}, aliados: ['vlad'], modManual: 0,
          notas: 'Mensagem entregue com sucesso.', resultado: null }
      ]
    };
  }

  function normalizeState(data) {
    if (!data || typeof data !== 'object') return estadoPadrao();
    var base = estadoPadrao();
    return {
      ciclo:      Number(data.ciclo)      || 1,
      recursos:   Number(data.recursos)   || 0,
      metais:     Number(data.metais)     || 0,
      influencia: Number(data.influencia) || 0,
      tropas:     data.tropas || base.tropas,
      faccoes:    Array.isArray(data.faccoes) ? data.faccoes : [],
      locais:     Array.isArray(data.locais)  ? data.locais  : [],
      missoes:    Array.isArray(data.missoes) ? data.missoes : []
    };
  }

  var current = null;

  function load() {
    var raw = CG.storage.read();
    current = raw ? normalizeState(raw) : estadoPadrao();
    return current;
  }

  function get() {
    if (!current) load();
    return current;
  }

  function set(next) {
    current = normalizeState(next);
    return current;
  }

  function save() {
    CG.storage.write(get());
  }

  function reset() {
    CG.storage.clear();
    current = estadoPadrao();
    return current;
  }

  function totalTropas() {
    return Object.keys(get().tropas).reduce(function (total, id) {
      return total + (get().tropas[id] || 0);
    }, 0);
  }

  CG.state = {
    estadoPadrao: estadoPadrao,
    normalizeState: normalizeState,
    load: load,
    get: get,
    set: set,
    save: save,
    reset: reset,
    totalTropas: totalTropas
  };
})(window.CG);
