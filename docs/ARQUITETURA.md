# Arquitetura

## Visão geral

Aplicação **cliente-servidor** de três camadas, executada em um único processo Python. É um **mural**: o mestre publica, os jogadores leem.

```
┌──────────────────────────────┐
│          Navegador           │
│  templates (Jinja) + ES mods │
└───────────────┬──────────────┘
                │ fetch (mesma origem)
                ▼
┌──────────────────────────────┐
│            Flask             │
│  /api/auth  /api/public      │
│  /api/master                 │
└───────────────┬──────────────┘
                │ SQLAlchemy Session
                ▼
┌──────────────────────────────┐
│      SQLite (instance/app.db)│
│      schema via Alembic      │
└──────────────────────────────┘
```

## Componentes

| Arquivo | Responsabilidade |
|---|---|
| `app.py` | Cria o app Flask, registra blueprints e define as páginas. Protege `/mestre/`. |
| `config.py` | Carrega `.env` e define `SECRET_KEY`, `MASTER_PASSWORD_HASH`, `DB_PATH` e cookies de sessão. |
| `db.py` | Engine SQLite (WAL, `foreign_keys`, `busy_timeout`) e sessão `scoped_session` por request. |
| `models.py` | Modelos: `Estado`, `Tropa`, `Aliado`, `Local`, `Missao`, `MissaoTropa`, `MissaoAliado`. Inclui `ensure_estado()` (cria a linha única de estado, idempotente). |
| `api/auth.py` | Login/logout/status com hash do Werkzeug e sessão Flask. |
| `api/public.py` | Leitura pública (estado e missões). |
| `api/master.py` | Escrita: estado, locais, tropas, aliados, missões e export. |
| `static/js/*` | Frontend em ES modules. |
| `templates/*` | Jinja apenas para `base.html`. |

> Não há seed automático. O `app.py` registra um `before_request` que chama `ensure_estado()` — a linha de `estado` é criada se faltar, sem sobrescrever dados.

## Modelo de dados

```
estado (1 linha, id=1)
tropas
aliados
locais ──< missoes >── missao_tropas >── tropas
                     └── missao_aliados >── aliados
```

- `aliados` é um catálogo informativo (nome, bônus em texto, habilidade) — sem cálculo.

- `missoes.local_id` → `locais.id` com `ON DELETE SET NULL` (apagar local não apaga missão).
- `missao_tropas` usa `ON DELETE CASCADE` (apagar missão limpa as alocações).
- `Local.status` ∈ `Livre`, `Neutro`, `Hostil`.
- `Missao.dt` é o valor final digitado pelo mestre; não há coluna de cálculo/resultado.

## Fluxo de uma requisição

1. O navegador chama um endpoint (`credentials: 'include'`).
2. O Flask resolve o blueprint. Rotas `/api/master/*` passam por `@requer_mestre`.
3. A rota lê/escreve via ORM (`get_db()`).
4. A resposta JSON volta e o frontend re-renderiza.
5. `close_db()` remove a sessão no fim do request.

## Segurança

- **Senha do mestre:** apenas hash (`MASTER_PASSWORD_HASH`) no `.env`.
- **Sessão:** cookie `HttpOnly`, `SameSite=Lax`, `Secure` em produção, expiração de 8h.
- **Autorização no servidor:** `@requer_mestre` em toda rota de escrita.
- **Sem mascaramento:** não há dado sensível; a leitura pública devolve o que o mestre publicou.
- **SQL:** o ORM usa bindings; o frontend escapa dados de usuário com `escapeHtml()`.

## Decisões de projeto

| Decisão | Motivo |
|---|---|
| Sem cálculo no backend | A regra vive na mesa; o app só guarda e mostra. |
| Sem rolagem/resolução | Simplifica e evita automação indevida. |
| Uma página por perfil | Menos navegação e código. |
| Frontend sem framework | CRUD simples + mapa em pointer events; vanilla é suficiente. |
| SQLite + WAL | Arquivo único, backup trivial e leitura concorrente. |

## Limitações conhecidas

- SQLite não é indicado para muitos escritores simultâneos (ok para uma mesa).
- Sem versionamento otimista: assume um mestre editando por vez.
- Sem autenticação para jogadores (por design).
