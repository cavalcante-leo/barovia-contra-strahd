# DEPLOY.md — Guia de Deploy e Persistência em Nuvem

> **Para agentes de IA (DeepSeek-Flash e afins):** este documento descreve como migrar o Conselho de Guerra de um app estático local (`file://` + `localStorage`) para uma aplicação hospedada no **GitHub Pages** com persistência de estado no **MongoDB Atlas**, usando uma camada serverless intermediária. Leia antes de alterar `carregar()`/`salvar()` em qualquer arquivo HTML.

---

## 1. Visão Geral da Arquitetura

O projeto sai de um modelo de **arquivo único + localStorage** para um modelo **cliente-servidor** com três camadas:

```
┌─────────────────────────┐
│   Navegador do Mestre   │
│  (index/tropas/faccoes) │
└───────────┬─────────────┘
            │ fetch(HTTPS)
            ▼
┌─────────────────────────┐
│  API Serverless         │
│  (Vercel / Netlify)     │
│  /api/estado            │
└───────────┬─────────────┘
            │ mongodb+srv://
            ▼
┌─────────────────────────┐
│  MongoDB Atlas          │
│  db: conselho-guerra    │
│  col: estado            │
└─────────────────────────┘
```

**Ponto crítico:** o **GitHub Pages só serve arquivos estáticos** — ele **não** executa Node.js, Python, nem qualquer backend. Por isso a API precisa morar em outro provedor (Vercel, Netlify, Cloudflare Workers, etc.).

---

## 2. Pré-requisitos

- Conta no **GitHub** (para o repositório e GitHub Pages)
- Conta no **MongoDB Atlas** (free tier M0)
- Conta na **Vercel** ou **Netlify** (free tier)
- Git instalado na máquina local
- Opcional: domínio próprio (não obrigatório)

---

## 3. Estrutura Final de Pastas

Após a migração, o repositório deve ficar assim:

```
conselho-guerra/
├── public/                    ← arquivos servidos pelo GitHub Pages
│   ├── index.html
│   ├── tropas.html
│   ├── faccoes.html
│   ├── mapa-barovia.jpg
│   ├── shared.js              ← (novo) funções comuns de API
│   └── assets/
│       └── (imagens, ícones)
│
├── api/                       ← funções serverless (Vercel)
│   ├── estado.js
│   └── _lib/
│       └── mongo.js           ← cliente MongoDB reutilizável
│
├── package.json
├── vercel.json
├── .env.local                 ← (NÃO commitar) MONGODB_URI
├── .gitignore
├── CONTEXT.md
├── DEPLOY.md                  ← este arquivo
└── README.md
```

> **Alternativa mais simples:** manter os HTMLs na raiz e criar apenas a pasta `api/`. Funciona com a Vercel, mas mistura frontend e backend no mesmo domínio — escolha um dos dois padrões e seja consistente.

---

## 4. Passo 1 — Preparar o MongoDB Atlas

### 4.1 Criar conta e cluster

1. Acesse https://www.mongodb.com/atlas e crie uma conta.
2. **Create Deployment → M0 (Free)**.
3. Escolha a região mais próxima (ex: AWS / São Paulo `sa-east-1`).
4. Aguarde o provisionamento (~2 min).

### 4.2 Configurar acesso

**Database Access → Add New Database User:**
- Username: `conselho-app`
- Password: gere uma senha forte e **salve-a** (vai na URI)
- Role: `Read and write to any database`

**Network Access → Add IP Address:**
- Selecione **Allow Access from Anywhere** (`0.0.0.0/0`)
- Necessário porque funções serverless têm IPs dinâmicos

### 4.3 Obter a Connection String

**Cluster → Connect → Drivers → Node.js:**

```
mongodb+srv://conselho-app:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

Substitua `<password>` pela senha real. **Guarde esta URI** — ela é o segredo da aplicação.

### 4.4 Criar o banco e a coleção

Não é necessário criar manualmente. Na primeira escrita, o driver cria:
- Banco: `conselho-guerra`
- Coleção: `estado`
- Documento único com `_id: 'atual'`

---

## 5. Passo 2 — Criar a API Serverless

### 5.1 Escolher o provedor

| Provedor | Prós | Contras |
|---|---|---|
| **Vercel** | Deploy em 1 comando, integração nativa com GitHub, free tier generoso | Requer `vercel.json` para CORS se frontend e backend estiverem em domínios diferentes |
| **Netlify Functions** | Mesmo padrão do Vercel, boa DX | Nomenclatura de pastas diferente (`netlify/functions/`) |
| **Cloudflare Workers** | Latência baixa global | Runtime diferente (V8 isolates), sem Node puro |
| **MongoDB Atlas Functions** | Roda dentro do próprio Atlas | Menos flexível; ideal apenas para lógica simples |

Recomendação: **Vercel** para simplicidade.

### 5.2 `package.json`

```json
{
  "name": "conselho-guerra",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=18.x"
  },
  "dependencies": {
    "mongodb": "^6.3.0"
  },
  "scripts": {
    "dev": "vercel dev"
  }
}
```

### 5.3 `api/_lib/mongo.js` — Cliente reutilizável

```js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI não definida nas variáveis de ambiente.');
}

// Cache da conexão entre invocações (padrão recomendado pela Vercel)
let cachedClient = global._mongoClient;
let cachedPromise = global._mongoPromise;

if (!cachedPromise) {
  cachedPromise = MongoClient.connect(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000
  });
  global._mongoPromise = cachedPromise;
}

export async function getCollection() {
  cachedClient = await cachedPromise;
  return cachedClient.db('conselho-guerra').collection('estado');
}
```

### 5.4 `api/estado.js` — Endpoint principal

```js
import { getCollection } from './_lib/mongo.js';

export default async function handler(req, res) {
  // CORS — permite que o GitHub Pages acesse a API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const col = await getCollection();

    if (req.method === 'GET') {
      const doc = await col.findOne(
        { _id: 'atual' },
        { projection: { _id: 0 } }
      );
      return res.status(200).json(doc || {});
    }

    if (req.method === 'POST') {
      const data = typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;

      if (!data || typeof data !== 'object') {
        return res.status(400).json({ error: 'Payload inválido.' });
      }

      // Sanitização mínima — nunca confie no cliente
      const sanitized = {
        ciclo:      Number(data.ciclo)      || 1,
        recursos:   Number(data.recursos)   || 0,
        metais:     Number(data.metais)     || 0,
        influencia: Number(data.influencia) || 0,
        tropas:     data.tropas  || {},
        faccoes:    Array.isArray(data.faccoes) ? data.faccoes : [],
        locais:     Array.isArray(data.locais)  ? data.locais  : [],
        missoes:    Array.isArray(data.missoes) ? data.missoes : [],
        updatedAt:  new Date()
      };

      await col.updateOne(
        { _id: 'atual' },
        { $set: sanitized },
        { upsert: true }
      );

      return res.status(200).json({ ok: true, updatedAt: sanitized.updatedAt });
    }

    return res.status(405).json({ error: 'Método não permitido.' });

  } catch (err) {
    console.error('[estado]', err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}
```

### 5.5 `vercel.json`

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}
```

### 5.6 `.env.local` (apenas local, NUNCA commitado)

```
MONGODB_URI=mongodb+srv://conselho-app:SUA_SENHA@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### 5.7 `.gitignore`

```
node_modules/
.vercel
.env
.env.local
.DS_Store
```

---

## 6. Passo 3 — Frontend Compartilhado

### 6.1 `shared.js`

Centralize o acesso à API em um único arquivo carregado pelos 3 HTMLs:

```js
// =====================================================================
// shared.js — Acesso à API de persistência
// =====================================================================
// Uso: incluir <script src="shared.js"></script> ANTES dos scripts
// específicos de cada página, para que carregar()/salvar() existam.
// =====================================================================

export const API_URL = 'https://SEU-PROJETO.vercel.app/api/estado';

const STORAGE_KEY = 'conselho-guerra-v1';

/**
 * Carrega o estado do servidor, com fallback para localStorage
 * e, em última instância, para estadoPadrao().
 * @param {Function} estadoPadrao - Função que retorna o estado padrão.
 */
export async function carregarEstado(estadoPadrao) {
  // 1. Cache local (resposta instantânea)
  let cached = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) cached = JSON.parse(raw);
  } catch (e) { /* ignore */ }

  // 2. Tenta o servidor
  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && (data.tropas || data.faccoes || data.locais)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (e) {
    console.warn('[carregar] Servidor indisponível, usando cache local.');
  }

  // 3. Fallback final
  return cached || estadoPadrao();
}

/**
 * Persiste o estado no localStorage e, em seguida, no servidor.
 * O salvamento local é síncrono; o remoto é fire-and-forget.
 */
export function salvarEstado(state) {
  // Sempre salva localmente primeiro
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* ignore */ }

  // Envia para o servidor sem bloquear a UI
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state)
  }).catch(err => {
    console.warn('[salvar] Falha ao sincronizar com o servidor:', err.message);
  });
}
```

### 6.2 Como adaptar cada HTML

No topo do `<script>` de cada página, substitua as funções locais:

**Antes:**
```js
function carregar(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){ const p = JSON.parse(raw); if(p && p.locais) return p; }
  }catch(e){}
  return estadoPadrao();
}
function salvar(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
```

**Depois:**
```html
<script type="module">
import { carregarEstado, salvarEstado } from './shared.js';

// ... (todo o resto do código: constantes, estadoPadrao, render, etc.)

let state;

// Boot assíncrono
(async () => {
  state = await carregarEstado(estadoPadrao);
  renderAll();
})();

function salvar() { salvarEstado(state); }
</script>
```

> **Atenção:** ao usar `type="module"`, o escopo do script deixa de ser global. Certifique-se de que não há dependências de variáveis globais entre `<script>` separados — consolide tudo em um único módulo.

### 6.3 Alternativa sem módulos ES (mais simples)

Se preferir evitar `type="module"`, inclua o `shared.js` como script clássico e exponha as funções globalmente:

```html
<script src="shared.js"></script>
<script>
  // ...
  let state;

  // O estado inicial é assíncrono; usa um boot imediato com placeholder
  state = estadoPadrao();
  carregarEstado(estadoPadrao).then(loaded => {
    state = loaded;
    renderAll();
  });

  function salvar() { salvarEstado(state); }
</script>
```

E no `shared.js`, remova os `export` e use `window.carregarEstado = ...`.

---

## 7. Passo 4 — Deploy da API na Vercel

### 7.1 Instalar a CLI

```bash
npm i -g vercel
```

### 7.2 Fazer login e linkar o projeto

```bash
vercel login
vercel link
```

### 7.3 Adicionar a variável de ambiente

**Pelo painel da Vercel:**
1. Acesse https://vercel.com/dashboard
2. Selecione o projeto → **Settings → Environment Variables**
3. Adicione `MONGODB_URI` com a connection string completa
4. Marque **Production**, **Preview** e **Development**

**Ou pela CLI:**
```bash
vercel env add MONGODB_URI production
# Cole a URI quando solicitado
```

### 7.4 Deploy

```bash
vercel --prod
```

Anote a URL de produção (ex: `https://conselho-guerra.vercel.app`).

### 7.5 Testar

```bash
# GET
curl https://conselho-guerra.vercel.app/api/estado

# POST (deve retornar {ok: true})
curl -X POST https://conselho-guerra.vercel.app/api/estado \
  -H "Content-Type: application/json" \
  -d '{"ciclo":1,"recursos":5,"tropas":{"matilha":1}}'
```

---

## 8. Passo 5 — Deploy do Frontend no GitHub Pages

### 8.1 Preparar o repositório

```bash
git init
git add .
git commit -m "Conselho de Guerra v1 — frontend estático + API MongoDB"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/conselho-guerra.git
git push -u origin main
```

### 8.2 Ativar o GitHub Pages

1. **Settings → Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` | **Folder:** `/ (root)` ou `/public`
4. Save

Em ~1 minuto, o site estará em `https://SEU-USUARIO.github.io/conselho-guerra/`.

### 8.3 Atualizar a URL da API no `shared.js`

```js
export const API_URL = 'https://conselho-guerra.vercel.app/api/estado';
```

Commit e push. O GitHub Pages reconstrói automaticamente.

---

## 9. Passo 6 — Verificação End-to-End

Roteiro de teste:

1. Abrir `https://SEU-USUARIO.github.io/conselho-guerra/`
2. Abrir o **DevTools → Network** e confirmar:
   - Chamada `GET /api/estado` retorna `200`
   - Chamada `POST /api/estado` ocorre após qualquer edição
3. Mover um nó no mapa → recarregar a página → a posição deve persistir
4. Criar uma missão em `index.html` → abrir `faccoes.html` na mesma sessão → dados consistentes
5. Abrir em outro navegador (sem cache local) → dados vêm do Atlas

Se qualquer etapa falhar, verifique:
- **CORS:** `Access-Control-Allow-Origin: *` está na resposta?
- **Env var:** `MONGODB_URI` está definida na Vercel (production)?
- **Network Access:** Atlas permite IP `0.0.0.0/0`?
- **Console do navegador:** erros de `fetch` ou `mixed content` (HTTP vs HTTPS)?

---

## 10. Boas Práticas e Armadilhas

### 10.1 Segurança

- **Nunca** commitar `.env.local` ou a URI com senha.
- **Nunca** colocar `MONGODB_URI` em código frontend.
- Considere adicionar **autenticação por token** se o repositório for público:
  ```js
  // Requer header Authorization em cada request
  if (req.headers.authorization !== `Bearer ${process.env.API_TOKEN}`) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }
  ```
- Limite o CORS a domínios específicos quando a autenticação estiver em uso:
  ```js
  res.setHeader('Access-Control-Allow-Origin', 'https://SEU-USUARIO.github.io');
  ```

### 10.2 Performance

- **Cache local do navegador**: o `localStorage` continua sendo a primeira fonte de leitura — a UI responde instantaneamente mesmo se a API estiver lenta.
- **Connection pooling**: o cache global (`global._mongoPromise`) evita reconectar a cada requisição.
- **Debounce em escritas**: se muitas alterações acontecerem em sequência (ex: arrastar o nó), agrupe os `POST`s:
  ```js
  let saveTimer;
  function salvar() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      fetch(API_URL, { method: 'POST', headers: {...}, body: JSON.stringify(state) });
    }, 800);
  }
  ```

### 10.3 Confiabilidade

- **Sempre** salve localmente antes de enviar ao servidor. Assim, se a API cair, o mestre não perde dados.
- **Sincronização manual**: adicione um botão "🔄 Sincronizar agora" que força um `GET` e sobrescreve o `state` local (útil ao trocar de máquina).
- **Conflitos multi-dispositivo**: como este é um projeto single-master, o `_id: 'atual'` funciona. Se múltiplos mestres editarem simultaneamente, adote versionamento otimista (`updatedAt` + verificação).

### 10.4 Custos

| Serviço | Free Tier |
|---|---|
| GitHub Pages | Ilimitado para repos públicos (soft limit ~1 GB / 100 GB/mês) |
| MongoDB Atlas M0 | 512 MB storage, 500 connections |
| Vercel Hobby | 100 GB-hora/mês de execução, 100 deploys/dia |

Para uma mesa de RPG típica, o uso mensal fica na casa dos **poucos MB** — nunca chega perto dos limites.

---

## 11. Rollback e Recuperação

### 11.1 Reverter para localStorage puro

Se a API sair do ar, o frontend continua funcional por causa do fallback. Para voltar 100% offline:

```js
// Em shared.js, force API_URL para null
export const API_URL = null;
// E em salvarEstado(), o fetch é pulado se API_URL for null
```

### 11.2 Restaurar de um JSON exportado

Se o Atlas for apagado acidentalmente:
1. Use o botão **↑ Importar** em qualquer página
2. Selecione o último `.json` exportado
3. O estado é restaurado localmente; o próximo `salvar()` reescreve no Atlas

### 11.3 Backup automático

Configure no Atlas: **Backup → Continuous Backups** (disponível apenas no M10+). No M0, exporte manualmente com `mongodump`:

```bash
mongodump --uri="mongodb+srv://..." --out=./backup-$(date +%F)
```

---

## 12. Checklist de Migração

Antes de considerar o deploy concluído:

- [ ] Cluster M0 criado no Atlas
- [ ] Usuário `conselho-app` com permissão read/write
- [ ] Network Access libera `0.0.0.0/0`
- [ ] Variável `MONGODB_URI` configurada na Vercel (production)
- [ ] Endpoint `GET /api/estado` retorna `{}` ou dados
- [ ] Endpoint `POST /api/estado` retorna `{ok: true}`
- [ ] `shared.js` criado com `carregarEstado`/`salvarEstado`
- [ ] Os 3 HTMLs importam `shared.js` e usam as funções
- [ ] `.env.local` no `.gitignore`
- [ ] GitHub Pages ativo e servindo o site
- [ ] URL da API atualizada em `shared.js`
- [ ] Teste E2E: mover nó → recarregar → posição persiste
- [ ] Teste cross-browser: abrir em navegador novo → dados vêm do Atlas
- [ ] README menciona a arquitetura (opcional)

---

## 13. Estrutura Final (Referência Rápida)

```
conselho-guerra/
│
├── .github/
│   └── workflows/               (opcional: CI/CD)
│
├── api/                         (Vercel Functions)
│   ├── estado.js
│   └── _lib/
│       └── mongo.js
│
├── public/                      (servido pelo GitHub Pages)
│   ├── index.html
│   ├── tropas.html
│   ├── faccoes.html
│   ├── mapa-barovia.jpg
│   └── shared.js
│
├── .env.local                   (NÃO COMMITAR)
├── .gitignore
├── CONTEXT.md
├── DEPLOY.md                    ← este arquivo
├── package.json
├── vercel.json
└── README.md
```

---

## 14. Referências

- [GitHub Pages — Docs](https://docs.github.com/en/pages)
- [MongoDB Atlas — Get Started](https://www.mongodb.com/docs/atlas/getting-started/)
- [Vercel — Serverless Functions](https://vercel.com/docs/functions)
- [MongoDB Node Driver — Connection Pooling](https://www.mongodb.com/docs/drivers/node/current/connect/connection-options/)
- [MDN — Using Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

---

**Última atualização:** schema v1 (`conselho-guerra-v1`)
**Compatibilidade:** requer `mongodb` driver ≥ 6.0 e Node.js ≥ 18
**Autor:** mesa de jogo / agente DeepSeek-Flash
**Licença:** uso pessoal