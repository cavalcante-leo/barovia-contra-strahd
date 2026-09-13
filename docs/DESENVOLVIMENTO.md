# Guia de Desenvolvimento

## Setup rápido

```bash
python -m venv .venv
# Windows: .venv\Scripts\Activate.ps1 | Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt

cp .env.example .env        # preencha SECRET_KEY e MASTER_PASSWORD_HASH
mkdir instance              # Windows: New-Item -ItemType Directory -Force instance
alembic upgrade head
python seed.py

python app.py               # http://localhost:5000
```

## Comandos úteis

| Comando | Função |
|---|---|
| `python app.py` | Sobe o servidor de desenvolvimento |
| `pytest -q` | Roda os testes |
| `alembic upgrade head` | Aplica migrations |
| `alembic revision --autogenerate -m "msg"` | Gera migration a partir dos modelos |
| `alembic current` / `alembic history` | Versão atual / histórico |
| `python scripts/definir_senha.py "senha"` | Atualiza o hash da senha no `.env` |

## Mapa do código

```
api/auth.py     → login/logout/status
api/public.py   → leitura pública (estado, missões)
api/master.py   → escrita (estado, locais, tropas, missões, export)
models.py       → 5 tabelas
static/js/mestre.js   → painel único do mestre
static/js/jogador.js  → página pública
static/js/mapa.js     → render do mapa (compartilhado)
static/js/missoes.js  → cards de missão (compartilhado)
static/js/api.js      → wrapper fetch + helpers
```

## Convenções

### Python
- PEP 8; nomes de domínio em PT-BR.
- Rotas de escrita **sempre** com `@requer_mestre`.
- Validação de entrada no servidor; erros retornam `400` com `{"error": "..."}`.
- **Não introduza cálculo de regras** (DT, bônus, penalidades, resolução): o app é um mural.

### JavaScript
- **ES modules** com `import`/`export`.
- Renderização via template strings + `escapeHtml()`.
- Após mutações, recarregar a visão e re-renderizar.

### UI / CSS
- Sem `border-radius`; sem sombras difusas; cores só da paleta pen & paper.
- Sem emojis.
- Estilos em `static/css/style.css`.

## Como adicionar uma rota

1. Escolha o blueprint (`public` para leitura, `master` para escrita).
2. No `master`, decore com `@requer_mestre`.
3. Leia/escreva com `get_db()`.
4. Valide entradas e retorne `jsonify(...)` com o status correto.
5. Adicione um teste em `tests/`.

## Como adicionar uma página

1. Crie o template em `templates/{jogador|mestre}/`.
2. Estenda o `base.html` correspondente.
3. Adicione a rota em `app.py`.
4. Implemente o bootstrap no `mestre.js`/`jogador.js` se necessário.

## Como alterar o schema

1. Edite `models.py`.
2. `alembic revision --autogenerate -m "descricao"`.
3. Revise o arquivo em `migrations/versions/`.
4. Faça backup: `cp instance/app.db instance/backups/app-$(date +%F).db`.
5. `alembic upgrade head`.

> SQLite exige `render_as_batch=True` (já configurado em `migrations/env.py`).

## Testes

- `tests/conftest.py` aponta o banco para um arquivo temporário antes de importar o app e cria o schema com `Base.metadata.create_all`.
- Fixtures: `client` (sem login) e `master_client` (logado).
- Arquivos: `test_auth`, `test_public`, `test_master`, `test_paginas`.

```bash
pytest -q
pytest tests/test_master.py -q
```

## Debug

- SQL: em `db.py`, use `create_engine(..., echo=True)`.
- Sessão: `GET /api/auth/status` mostra se o mestre está logado.
- Rotas: acesse `http://localhost:5000/api/...` no navegador (GET) ou use `curl`.

## Antes de abrir um PR

- [ ] `pytest -q` verde
- [ ] Nenhum emoji; nenhuma cor fora da paleta; sem `border-radius`
- [ ] Nenhum cálculo de regras adicionado (a DT é digitada)
- [ ] Rotas de escrita com `@requer_mestre`
- [ ] Migrations commitadas quando o schema mudou
- [ ] `.env`/`instance/` fora do Git
