# Conselho de Guerra — Baróvia

[![CI](https://github.com/cavalcante-leo/barovia-contra-strahd/actions/workflows/ci.yml/badge.svg)](https://github.com/cavalcante-leo/barovia-contra-strahd/actions/workflows/ci.yml)

Quadro de avisos interativo para uma campanha de **Curse of Strahd** (D&D 5e). O **mestre** publica missões, tropas e recursos; os **jogadores** consultam tudo em modo leitura, principalmente pelo celular.

---

## Índice

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Requisitos](#requisitos)
- [Como rodar](#como-rodar)
- [Acessos](#acessos)
- [Testes](#testes)
- [API (resumo)](#api-resumo)
- [Documentação](#documentação)
- [Convenções](#convenções)
- [Licença](#licença)

---

## Funcionalidades

- **Login do mestre** (senha única em hash no `.env`).
- **Página pública** (sem login): mapa, missões, tropas e recursos — somente leitura.
- **Painel do mestre**: CRUD de missões, locais e tropas; edição de recursos; exportação de backup.
- **Mapa interativo**: nós arrastáveis (posição em `%`), status por cor (Livre/Neutro/Hostil) e contador de missões.
- **Missões** com nome, tipo (Busca/Reconhecimento/Controle), local, **DT digitada pelo mestre**, notas e tropas alocadas.
- **Aliados** (informativo): nome, bônus e habilidade.
- **Recursos**: Madeira, Pedra, Metais, Suprimentos.
- **Exportar JSON** com todo o estado.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Flask 3 (Python 3.11+) |
| Banco | PostgreSQL (Supabase) via SQLAlchemy 2.0 ORM — SQLite local como fallback |
| Migrations | Alembic |
| Frontend | HTML + CSS + JavaScript puro (**ES modules**) |
| Templates | Jinja2 (apenas `base.html`) |
| Autenticação | Session cookie do Flask |

## Arquitetura

```
Navegador ──HTTP──► Flask (Gunicorn/Waitress) ──SQLAlchemy──► PostgreSQL (Supabase)
   │                       │
   │                       ├── /api/auth/*    → login/logout do mestre
   │                       ├── /api/public/*  → leitura (sem login)
   │                       └── /api/master/*  → escrita (sessão do mestre)
   │
   └── static/js/*  (ES modules)  +  templates/*  (Jinja)
```

- **Sem cálculo no backend.** `api/calc.py` e afins não existem.
- **Sem mascaramento:** o jogador vê exatamente o que o mestre publicou.

## Estrutura de pastas

```
.
├── app.py                 # entrypoint Flask + rotas de páginas
├── config.py              # .env, paths e sessão
├── db.py                  # engine/sessão SQLAlchemy (WAL, FK, busy_timeout)
├── models.py              # modelos (7 tabelas)
├── alembic.ini
├── migrations/            # env.py + versions/
├── api/
│   ├── auth.py            # /api/auth/*
│   ├── public.py          # /api/public/*  (leitura)
│   └── master.py          # /api/master/*  (escrita)
├── templates/
│   ├── jogador/{base,index}.html
│   └── mestre/{base,login,index}.html
├── static/
│   ├── css/style.css
│   ├── img/mapa-barovia.jpg
│   └── js/{api,mapa,missoes,mestre,jogador}.js
├── tests/                 # pytest
├── docs/                  # documentação detalhada
├── instance/app.db        # SQLite local (fallback; NÃO versionado)
├── requirements.txt / requirements-dev.txt
├── .env / .env.example
└── README.md
```

## Requisitos

- **Python 3.11+** (recomendado 3.12)
- **pip** e **venv**
- Git

## Como rodar

### 1. Clonar e criar o ambiente virtual

```bash
git clone https://github.com/cavalcante-leo/barovia-contra-strahd.git
cd barovia-contra-strahd

python -m venv .venv
# Windows (PowerShell): .venv\Scripts\Activate.ps1
# Linux/macOS:         source .venv/bin/activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt   # opcional: testes
```

### 3. Configurar o `.env`

```bash
cp .env.example .env
```

Gere os segredos e cole no `.env`:

```bash
# SECRET_KEY (32+ bytes aleatórios)
python -c "import secrets; print(secrets.token_hex(32))"

# MASTER_PASSWORD_HASH (hash da senha do mestre)
python -c "from werkzeug.security import generate_password_hash as g; print(g('sua-senha'))"
```

Ou defina a senha automaticamente:

```bash
python scripts/definir_senha.py "sua-senha"
```

Exemplo de `.env`:

```
SECRET_KEY=<cole aqui>
MASTER_PASSWORD_HASH=<cole aqui>
FLASK_ENV=development
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.SEU_PROJETO.supabase.co:5432/postgres
```

> O valor de `MASTER_PASSWORD_HASH` deve começar com `scrypt:` **uma única vez**.
> No `DATABASE_URL`, **não** inclua os colchetes ao redor da senha (eles são só o placeholder do Supabase). Sem `DATABASE_URL`, o app usa SQLite em `instance/app.db`.

### 4. Criar/atualizar o banco

```bash
# SQLite local (se não houver DATABASE_URL): cria a pasta
mkdir instance            # Windows: New-Item -ItemType Directory -Force instance

alembic upgrade head
```

> Não há seed automático. A linha única de `estado` é criada na primeira inicialização (idempotente, sem resetar dados); tropas, locais e aliados começam vazios e são cadastrados pelo painel do mestre.

### 5. Subir o servidor

```bash
python app.py
```

Acesse **http://localhost:5000**.

## Acessos

| Perfil | URL | Credenciais |
|---|---|---|
| Jogador | http://localhost:5000/ | nenhuma (público) |
| Mestre | http://localhost:5000/mestre/login | senha definida em `MASTER_PASSWORD_HASH` |

## Testes

```bash
pytest -q
```

Cobrem autenticação, leitura pública, CRUD do mestre, validação de DT e páginas/estáticos.

## API (resumo)

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/auth/login` | — | Login do mestre |
| POST | `/api/auth/logout` | — | Logout |
| GET | `/api/auth/status` | — | `{master: bool}` |
| GET | `/api/public/estado` | — | Estado, tropas, locais e aliados |
| GET | `/api/public/missoes` | — | Missões com a DT do mestre |
| POST | `/api/master/estado` | mestre | Atualiza ciclo e recursos |
| GET | `/api/master/export` | mestre | Backup JSON |
| POST/PUT/DELETE | `/api/master/locais[/<id>]` | mestre | CRUD de locais |
| POST/PUT/DELETE | `/api/master/tropas[/<id>]` | mestre | CRUD de tropas |
| POST/PUT/DELETE | `/api/master/aliados[/<id>]` | mestre | CRUD de aliados (informativo) |
| POST/PUT/DELETE | `/api/master/missoes[/<id>]` | mestre | CRUD de missões (DT obrigatória) |

Detalhes em [docs/API.md](docs/API.md).

## Deploy

Arquivos prontos para deploy:

- `.python-version` / `runtime.txt` — fixam **Python 3.12** (o SQLAlchemy 2.0 não é compatível com Python 3.14).
- `Procfile` — `gunicorn` (Heroku/Railway).
- `render.yaml` — blueprint do Render.
- `Dockerfile` — imagem Python 3.12 com migrations + Gunicorn.

Variáveis de ambiente no host: `SECRET_KEY`, `MASTER_PASSWORD_HASH` e `DATABASE_URL` (Supabase). O `startCommand`/`CMD` roda `alembic upgrade head` antes de subir o servidor.

## Documentação

| Documento | Conteúdo |
|---|---|
| [RELEASE-v1.2.md](RELEASE-v1.2.md) | Descritivo da release v1.2 |
| [docs/API.md](docs/API.md) | Referência dos endpoints |
| [docs/ARQUITETURA.md](docs/ARQUITETURA.md) | Componentes e modelo de dados |
| [docs/DESENVOLVIMENTO.md](docs/DESENVOLVIMENTO.md) | Setup, testes, migrations e convenções |
| [docs/GUIA-MESTRE.md](docs/GUIA-MESTRE.md) | Como usar o painel do mestre |
| [docs/GUIA-JOGADOR.md](docs/GUIA-JOGADOR.md) | Como consultar o conselho |

## Integração contínua

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em push/PR para `main` e `develop`:

- **Testes:** `pytest -q` (Python 3.12).
- **Build:** valida as migrations em um SQLite limpo e constrói a imagem Docker.

## Licença

Uso pessoal / mesa privada.
