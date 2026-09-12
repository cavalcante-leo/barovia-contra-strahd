window.CG = window.CG || {};

(function (CG) {
  'use strict';

  CG.constants = {
    STORAGE_KEY: 'conselho-guerra-v1',

    TIPOS: { B: 'Busca', R: 'Reconhecimento', C: 'Controle' },

    DIFICULDADES: [
      { nome: 'Fácil', dt: 10 },
      { nome: 'Moderada', dt: 15 },
      { nome: 'Difícil', dt: 20 },
      { nome: 'Muito Difícil', dt: 25 }
    ],

    TROPAS: [
      { id: 'matilha',     nome: 'Tropa da Matilha',        desc: 'Lobisomens civilizados. +1 no teste. +2 extra se Melissa liderar.' },
      { id: 'mortosvivos', nome: 'Cavaleiros Mortos-Vivos', desc: 'Cavaleiros do Silvado libertos. +1 no teste. Indisponível enquanto Comandada.' },
      { id: 'coletores',   nome: 'Coletores de Vallaki',    desc: 'Milícia local. +1 em missões de Busca. Requer Vallaki Livre.' },
      { id: 'dragoes',     nome: 'Cavaleiros Dragões',      desc: 'Treinados nos dogmas de Aurore. +1 em missões de Controle.' },
      { id: 'pena',        nome: 'Guardiões da Pena',       desc: 'Corvos licantropos do vinhedo. +1 em missões de Reconhecimento.' }
    ],

    ALIADOS: [
      { id: 'marius',      nome: 'Marius',      bonus: 2, tipo: 'C' },
      { id: 'elvira',      nome: 'Elvira',      bonus: 2, tipo: 'C' },
      { id: 'vlad',        nome: 'Vlad',        bonus: 0, tipo: 'R' },
      { id: 'melissa',     nome: 'Melissa',     bonus: 4, tipo: 'C' },
      { id: 'bartholomeu', nome: 'Bartholomeu', bonus: 2, tipo: 'R' },
      { id: 'ezmerelda',   nome: 'Ezmerelda',   bonus: 2, tipo: 'C' },
      { id: 'vanritchen',  nome: 'Van Richten', bonus: 2, tipo: 'R' },
      { id: 'madalena',    nome: 'Madalena',    bonus: 0, tipo: '-' },
      { id: 'astyanax',    nome: 'Astyanax',    bonus: 0, tipo: '-' }
    ],

    STATUS_LIST: ['Livre', 'Neutro', 'Infiltrado', 'Controlado', 'Hostil']
  };
})(window.CG);
