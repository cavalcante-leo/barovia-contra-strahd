# CONTEXT.md — Conselho de Guerra de Baróvia

> **Para agentes de IA (DeepSeek-Flash e afins):** este arquivo é o briefing canônico do projeto. Leia por completo antes de alterar qualquer código. Ele descreve o objetivo, a arquitetura, os contratos entre arquivos e as convenções visuais que devem ser preservadas.

---

## 1. Visão Geral do Projeto

**Nome:** Conselho de Guerra — Baróvia
**Propósito:** Aplicação web estática (HTML/CSS/JS puro, sem build) que serve como painel de gerenciamento de uma campanha de RPG ambientada em *Curse of Strahd* (D&D 5e). É uma ferramenta de mesa para um "conselho de guerra" entre sessões.

**Domínio:** Gerencia **tropas**, **recursos**, **facções**, **locais no mapa** e **missões** (com cálculo automático de Dificuldade, bônus, desvantagem/vantagem e resolução por rolagem de d20).

**Público-alvo:** 1 narrador/mesa com 3-6 jogadores, rodando no navegador durante/entre sessões.

---

## 2. Stack & Restrições

| Aspecto | Decisão |
|---|---|
| Linguagem | HTML5 + CSS3 + JavaScript (ES6+, vanilla, sem transpilação) |
| Build | **Nenhum** — arquivos abrem direto via `file://` ou servidor estático simples |
| Dependências externas | Apenas **Google Fonts (Inter)** via `<link>` |
| Persistência | `localStorage` (chave `conselho-guerra-v1`) + JSON export/import |
| Estilo visual | **Pen & Paper**: preto/branco/cinza, sem `border-radius`, sem sombras coloridas, bordas retas |
| Fonte | **Inter** exclusivamente (pesos 400–900) |
| Cores de destaque | `--teal-dark` (#1b4b4b), `--coral` (#e16550), `--cream` (#f5e8c8) — **somente** como accents |
| Responsividade | Grid adaptativo até ~700px (mobile empilha navegação) |

**Regra de ouro:** nunca introduzir dependências (React, Tailwind, jQuery, bundlers). Se precisar de biblioteca, justifique e mantenha inline/CDN.

---

## 3. Estrutura de Arquivos

```
raiz/
├── index.html              # Mapa interativo + quadro de missões (só marcação)
├── tropas.html             # Recursos da fortaleza + composição de tropas
├── faccoes.html            # Cartas de facções com controles individuais
├── contexto.md             # Este arquivo
└── src/
    ├── assets/
    │   └── mapa-barovia.jpg    # Imagem de fundo do mapa (obrigatória)
    ├── css/
    │   ├── base.css            # :root, reset, tipografia, botões, modal, campos, chips
    │   ├── layout.css          # topbar, nav, ciclo, io-box, page-header, summary-bar
    │   ├── mapa.css            # mapa, nós, sidebar e cards de missão
    │   ├── tropas.css          # recursos e cards de tropa
    │   └── faccoes.css         # grid e cards de facção
    └── js/
        ├── core/
        │   ├── constants.js    # STORAGE_KEY, TIPOS, DIFICULDADES, TROPAS, ALIADOS, STATUS_LIST
        │   ├── helpers.js      # uid, rnd, statusClasse
        │   ├── storage.js      # read/write/clear do localStorage
        │   ├── state.js        # estadoPadrao, normalizeState, load/save/reset, get/set
        │   ├── missao.js       # calcMissao (pura), rolarMissao
        │   └── io.js           # exportState, importState
        ├── ui/
        │   ├── dom.js          # $, $$, escapeHtml
        │   ├── modal.js        # abrir/fechar modal + wiring global
        │   └── topbar.js       # ciclo + export/import
        └── pages/
            ├── index.js        # controlador do mapa/missões
            ├── tropas.js       # controlador de recursos/tropas
            └── faccoes.js      # controlador de facções
```

**Arquitetura JS:** scripts clássicos (`<script src>`) com namespace global `window.CG` — sem módulos ES e sem build, preservando `file://`. Ordem de carregamento no fim do `<body>`:
`constants → helpers → storage → state → missao → io → dom → modal → topbar → pages/<pagina>.js`.

**Contrato entre os três HTMLs:**
- Todos compartilham a **mesma chave de localStorage** (`conselho-guerra-v1`) → qualquer alteração em um é visível nos outros.
- Todos têm o **mesmo topbar** (brand + nav + ciclo + botões ↓/↑ de export/import).
- Os módulos `core` e `ui` são compartilhados; cada página implementa apenas `renderAll()` e o seu controlador em `src/js/pages/`.
- **`estadoPadrao()` é única** (em `src/js/core/state.js`) — se alterar o schema, altere só lá. `normalizeState()` preenche estados parciais/antigos.
- Campos preenchidos pelo usuário (`nome`, `notas`, `status`) são escapados via `CG.dom.escapeHtml()` antes de entrar em templates HTML.

---

## 4. Modelo de Dados (`state`)

Objeto único persistido em JSON. Schema canônico:

```js
state = {
  ciclo: Number,              // contador de ciclos do conselho (≥1)
  recursos: Number,           // estoque de suprimentos em Krezk
  metais: Number,             // matéria-prima para Madalena
  influencia: Number,         // influência global de Strahd (contador manual)

  tropas: {                   // mapa id → quantidade
    matilha: Number,          // 0..10 (soma total ≤ 10)
    mortosvivos: Number,
    coletores: Number,
    dragoes: Number,
    pena: Number
  },

  faccoes: [{
    id: String,               // slug único (ex: 'karsten')
    nome: String,
    status: 'Livre'|'Neutro'|'Infiltrado'|'Controlado'|'Hostil',
    espioes: Number,
    capEspioes: Number,       // teto de penalidade global
    tropas: Number,
    influencia: Number,
    penalGlobal: Boolean      // se true, espiões entram em DT de TODAS as missões
  }],

  locais: [{
    id: String,
    nome: String,
    status: mesmo enum acima,
    x: Number,                // % horizontal (4..96)
    y: Number                 // % vertical (6..94)
  }],

  missoes: [{
    id: String,               // uid() aleatório
    nome: String,
    tipo: 'B'|'R'|'C',        // Busca | Reconhecimento | Controle
    localId: String,          // referência a locais[].id
    dtBase: Number,           // 10/15/20/25 por padrão
    tropas: { [troopId]: Number },
    aliados: [String],        // ids de ALIADOS
    modManual: Number,        // ajuste manual de DT (+/−)
    notas: String,
    resultado: null | {       // null = não rolada; objeto = última rolagem
      dado: Number,
      total: Number,          // dado + bônus
      dt: Number,             // DT final no momento da rolagem
      nivel: String,          // texto amigável
      classe: String,         // 'res-crit'|'res-suc'|...
      desc: String            // descrição da rolagem (ex: "2d20 [8,15] → 15 (vant.)")
    }
  }]
}
```

### Constantes de referência (hardcoded em cada HTML)

- `TIPOS = { B:'Busca', R:'Reconhecimento', C:'Controle' }`
- `DIFICULDADES = [ {Fácil,10}, {Moderada,15}, {Difícil,20}, {Muito Difícil,25} ]`
- `TROPAS[]` — catálogo (id, nome, desc) das 5 tropas
- `ALIADOS[]` — catálogo de 9 NPCs (id, nome, bonus, tipo, desc)
- `STATUS_LIST = ['Livre','Neutro','Infiltrado','Controlado','Hostil']`

---

## 5. Lógica de Negócio (Regras do Conselho)

### 5.1 Cálculo de DT Final (`calcMissao`)

```
DT Final = DT Base
         + Globais   (soma de min(espioes, capEspioes) para cada facção com penalGlobal=true)
         + Específico (+2 por tropa do Cavaleiros do Silvado, máx +6 — APENAS tipo 'C')
         + Local      (Infiltrado/Controlado: +2; Hostil: +5 e bloqueia)
         + Manual     (m.modManual)
```

### 5.2 Bônus de Teste (soma no d20)

- **Aliados:** +N se `aliado.tipo === missao.tipo`; senão +0 (registrado como "fora de especialidade")
- **Tropas:** cada tropa dá +1 no tipo "certo":
  - `matilha` → qualquer tipo (+1)
  - `mortosvivos` → qualquer tipo (+1)
  - `coletores` → tipo **B**
  - `dragoes` → tipo **C**
  - `pena` → tipo **R**
- **Bônus extra:** `melissa` alocada + `matilha > 0` → +2 adicional

### 5.3 Modificadores de Rolagem (Vantagem/Desvantagem)

| Status do Local | Efeito |
|---|---|
| Livre | **Vantagem** (2d20, mantém o maior) |
| Neutro | Normal (1d20) |
| Infiltrado / Controlado | **Desvantagem** (2d20, mantém o menor) |
| Hostil | **Bloqueado** — não é possível partir sem "romper o cerco" |

### 5.4 Faixas de Sucesso (`rolarMissao`)

| Margem | Nível | Classe CSS |
|---|---|---|
| `total ≥ DT + 5` | ✦ Sucesso Crítico | `res-crit` |
| `total ≥ DT` | ✓ Sucesso | `res-suc` |
| `total ≥ DT − 3` | ◐ Sucesso Parcial | `res-parc` |
| `total > DT − 5` | ✗ Fracasso | `res-fail` |
| demais | ☠ Fracasso Crítico | `res-critfail` |

### 5.5 Limites

- Soma de `state.tropas` **nunca ultrapassa 10** (validado nos botões `+`)
- Coordenadas dos nós do mapa: `x ∈ [4,96]`, `y ∈ [6,94]`

---

## 6. Persistência e Portabilidade

### 6.1 `localStorage`
- Chave: `conselho-guerra-v1`
- `carregar()` tenta `JSON.parse` e cai em `estadoPadrao()` em caso de erro
- `salvar()` é chamado dentro de `renderAll()` a cada mudança

### 6.2 Export / Import JSON
- **Export:** `exportState()` — serializa `state` com `JSON.stringify(_, null, 2)`, gera `Blob`, dispara download com nome `conselho-guerra-ciclo{N}-{YYYY-MM-DD}.json`
- **Import:** `importState(file)` — valida estrutura (deve ter ao menos um de `tropas/faccoes/locais/missoes`), pede confirmação, normaliza campos (`Number()` em escalares, `Array.isArray` em coleções) e chama `renderAll()`
- **Contrato:** o JSON exportado em qualquer uma das 3 páginas é **idêntico** e pode ser importado em qualquer uma das outras.

---

## 7. Design System (Pen & Paper)

### 7.1 Variáveis CSS (definidas em `:root`)

```
--ink         #000    → texto, bordas principais
--paper       #fff    → fundo de cards
--paper-2/3/4 #f4..dc → fundos de seção
--gray-1..5   #c4..1a → textos secundários, bordas fracas
--teal-dark   #1b4b4b → accent primário (headers, botões primary, status Controlado)
--teal-mid    #2d6b6b → subtítulos
--coral       #e16550 → accent de alerta (Hostil, DT, botões hover perigosos)
--coral-dark  #c44c38 → texto coral sobre claro
--cream       #f5e8c8 → fundo de destaques (Livre, chips de bônus)
--cream-dark  #e8d5a0 → borda cream
```

### 7.2 Convenções Obrigatórias

- ❌ **Nunca** usar `border-radius` (quebra o estilo pen & paper)
- ❌ **Nunca** usar `box-shadow` colorido ou difuso — apenas deslocamento sólido (`Xpx Ypx 0 var(--ink)`)
- ❌ **Nunca** introduzir cores fora da paleta (nada de roxo brilhante, verde neon, etc.)
- ✅ Botões: borda 1px `--ink`, hover inverte (fundo `--ink`, texto `--paper`)
- ✅ Botões primários: fundo `--teal-dark`, hover → `--coral`
- ✅ Cabeçalhos com marcador: `::before` quadrado 8-14px na cor de accent
- ✅ Cartas com `::before` lateral colorido indicando status/tipo
- ✅ Fontes: sempre `'Inter'`, `font-weight` explícito (600/700/800/900), `letter-spacing` negativo em títulos

### 7.3 Mapeamento de Cores por Status

| Status | Cor de fundo / marcação |
|---|---|
| Livre | `--cream` |
| Neutro | `--gray-1` |
| Infiltrado | listras `--teal-dark` + `--cream` |
| Controlado | `--teal-dark` |
| Hostil | `--coral` |

### 7.4 Mapeamento de Cores por Tipo de Missão

| Tipo | Marcação superior |
|---|---|
| B (Busca) | `--cream` + borda inferior `--ink` |
| R (Reconhecimento) | listras diagonais `--teal-dark`/`--cream` |
| C (Controle) | `--coral` |

---

## 8. Arquitetura de Cada Página

> A lógica compartilhada fica em `src/js/core` e `src/js/ui` (namespace `CG`). Cada página tem um controlador próprio em `src/js/pages/` que define o seu `renderAll()` e passa essa função para `CG.topbar.init(renderAll)`.

### 8.1 `index.html` — Mapa & Missões (`src/js/pages/index.js`)

- **Layout:** `grid` de 2 colunas (`1fr 420px`) — mapa à esquerda, sidebar de missões à direita
- **Mapa:** `background-image: url('mapa-barovia.jpg')` — os nós `.map-node` são posicionados em `%` sobre a imagem
- **Interação dos nós:**
  - `pointerdown` inicia arrasto (`setPointerCapture`)
  - `pointermove` atualiza `l.x/l.y` em tempo real
  - `pointerup` → se moveu, salva; se não moveu (< 3px), abre `abrirLocalModal(l)`
- **Labels dos nós:** ocultos por padrão (`opacity:0; visibility:hidden`), aparecem em `:hover` e `.dragging`
- **Badge de missões:** `.node-badge` mostra a contagem de missões com `localId === l.id`
- **Sidebar:** cards `.mission-mini` com botões `Rolar Teste` (executa `rolarMissao`) e `Limpar` (zera `.resultado`)
- **Modais:** `abrirMissaoModal(m)` e `abrirLocalModal(l)` — ambos aceitam `null` (criar) ou objeto (editar)

### 8.2 `tropas.html` — Recursos & Tropas (`src/js/pages/tropas.js`)

- **Layout:** `page-content` em coluna única, largura máxima 1200px
- **Seções:**
  1. `summary-bar` — 4 KPIs (total tropas, capacidade, influência, ciclo)
  2. `resources-grid` — 4 cards (Recursos, Metais, Influência Strahd, Tropas Totais) com `.stepper`
  3. `troops-grid` — 5 cards de tropa com `+`/`−` e limite global de 10
- **Estado compartilhado:** usa apenas `state.tropas`, `state.recursos`, `state.metais`, `state.influencia`, `state.ciclo`
- **Não renderiza** mapa, facções ou missões

### 8.3 `faccoes.html` — Facções (`src/js/pages/faccoes.js`)

- **Layout:** `faccoes-grid` responsivo (`minmax(340px,1fr)`)
- **Card de facção:**
  - Barra lateral colorida por status (`::before`)
  - `<select class="fc-status">` inline para mudar status
  - 4 linhas `.fc-stat` com steppers (Espiões, Tropas, Influência, Teto de Espiões)
  - Rodapé com valor calculado da penalidade global (`min(espioes, capEspioes)`)
  - Checkbox `penalGlobal`
  - Botões no header: **✎ editar** (abre modal) e **✕ remover**
- **Modal `abrirFaccaoModal(faccao|null)`:** cria ou edita — quando edita, atualiza o objeto existente em vez de empurrar novo
- **`renderResumo()`:** calcula KPIs (total, hostis, espiões somados, influência somada) — não usa o `state.influencia` global, e sim a soma das facções

---

## 9. Fluxos de Trabalho Típicos

### 9.1 Criar uma nova missão
1. Clicar em **+ Missão** (topbar ou sidebar)
2. Preencher nome, tipo, local, DT base
3. Selecionar tropas (respeitando estoque) e aliados
4. Salvar → `state.missoes.push(m)` → `renderAll()` → `salvar()`

### 9.2 Resolver uma missão
1. Clicar em **Rolar Teste** no card
2. `rolarMissao(id)` calcula `calcMissao(m)`, rola d20 (ou 2d20 se vantagem/desvantagem), soma `totalBonus`, compara com `dtFinal`
3. Armazena `m.resultado = { dado, total, dt, nivel, classe, desc }`
4. Card mostra o resultado colorido

### 9.3 Mover um local no mapa
1. `pointerdown` no nó → `.dragging` (label visível)
2. Arrastar → `l.x/l.y` atualizados, `style.left/top` recalculados
3. `pointerup` → `salvar()` (sem abrir modal se houve movimento)
4. **Clique simples** (sem arrastar) → abre `abrirLocalModal(l)`

### 9.4 Backup / Restauração
1. **↓** → baixa `conselho-guerra-ciclo{N}-{data}.json`
2. **↑** → seleciona arquivo, valida, confirma, substitui `state`, renderiza

---

## 10. Armadilhas Conhecidas (para o agente)

1. **`STORAGE_KEY` é única** — definida em `src/js/core/constants.js`. Nunca replique a string em outros arquivos.
2. **`renderAll()` é o único ponto de salvamento** — não chame `salvar()` avulso. Exceções: `pointerup` do mapa (evitar salvar a cada frame) e handlers triviais.
3. **`calcMissao(m)` é pura** — não muta `state`. Se precisar de mais contexto, estenda os parâmetros.
4. **IDs são gerados com `uid()`** = `Math.random().toString(36).slice(2,9)` — não há garantia de colisão zero, mas é aceitável para uso local.
5. **Ordem de render é importante em `index.html`:** `renderCiclo` → `renderMapa` → `renderMissoes` → `salvar`. Map antes de missões garante que os badges apareçam corretos.
6. **`melissa` tem bônus duplo** — `bonus: 4` (quando tipo coincide) **e** `+2` extra se `matilha > 0`. Não remover essa exceção.
7. **`abrirLocalModal` apaga em cascata? Não** — remover um local **não** remove missões associadas; elas ficam com `localId` órfão. Se quiser consertar, prefira "reapontar missões" a deletar.
8. **`capEspioes` pode ser 0** — nesse caso, `Math.min(espioes, 0) === 0`, sem penalidade. Respeite isso.
9. **Cores fora da paleta** quebram a coerência pen & paper — sempre use as variáveis CSS.
10. **Escape sempre dados do usuário** — use `CG.dom.escapeHtml()` em qualquer campo (`nome`, `notas`, `status`) interpolado em templates `innerHTML`.

---

## 11. Roadmap Sugerido (para o agente)

Prioridades prováveis, em ordem de valor:

1. **Validação de exclusão em cascata** — ao remover um local/facção/tropa, oferecer opções (reatribuir / manter órfão / deletar dependentes)
2. **Histórico de ciclos** — botão "avançar ciclo" que arquiva o estado atual num array `state.historico[]`
3. **Log de eventos aleatórios (1d10)** — implementar a tabela da seção 6 do documento original do jogo
4. **Impressão / PDF** — `@media print` para gerar uma folha de conselho
5. **Atalhos de teclado** — `N` nova missão, `E` exportar, `S` salvar
6. **Tema alternativo** — manter o pen & paper como padrão, mas permitir um "dark mode" opcional (respeitando as cores de accent)
7. **Sidebar de aliados** em `faccoes.html` — atualmente os 9 NPCs estão só nos dados, sem UI dedicada

---

## 12. Como Rodar Localmente

```bash
# Opção 1 — abrir direto
# Basta dar duplo clique em index.html (funciona via file://)

# Opção 2 — servidor estático (recomendado para consistência de localStorage)
python3 -m http.server 8000
# Abrir http://localhost:8000/index.html

# Ou com Node
npx serve .
```

**Ordem de navegação esperada:** `index.html` ↔ `tropas.html` ↔ `faccoes.html` (links no topbar).

---

## 13. Glossário Rápido

| Termo | Significado |
|---|---|
| **Ciclo** | Unidade de tempo entre sessões do conselho (contador global) |
| **DT** | Dificuldade Total — alvo do teste |
| **Missão** | Ação planejada (Busca/Reconhecimento/Controle) |
| **Tropa** | Unidade militar (5 tipos) |
| **Aliado / Líder** | NPC que concede bônus em missões (9 no catálogo) |
| **Ponto de apoio** | Local de onde a missão parte; afeta vantagem/desvantagem |
| **Influência de Strahd** | Contador de domínio do vilão sobre uma facção/local |
| **Espião** | Penalidade de DT global (facção com `penalGlobal`) |
| **Romper o cerco** | Ação para liberar um local Hostil (não implementado como botão) |

---

## 14. Checklist Antes de Commit (para o agente)

Antes de considerar uma tarefa concluída, verifique:

- [ ] As três páginas continuam abrindo sem erro no console
- [ ] O `localStorage` ainda usa a chave `conselho-guerra-v1`
- [ ] Exportar em `index.html` e importar em `faccoes.html` preserva todos os dados
- [ ] Nenhuma nova dependência foi adicionada ao HTML
- [ ] Cores usadas pertencem à paleta (nenhum hex avulso fora de `:root`)
- [ ] Nenhum `border-radius` novo foi introduzido
- [ ] O modal de missão ainda respeita o estoque de tropas (`max="${disp}"`)
- [ ] Soma de tropas nunca passa de 10
- [ ] `calcMissao()` continua pura (não muta `state`)
- [ ] Botões `+`/`−` estão desabilitados nos limites (0 e 10)

---

**Última atualização:** estrutura `src/` + namespace `CG` (schema v1 `conselho-guerra-v1`)
**Mantenedor:** mesa de jogo (não há equipe de dev dedicada)
**Licença:** uso pessoal / mesa privada