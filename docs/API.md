# API — Referência

Base local: `http://localhost:5000`. Todas as respostas são JSON.

Convenções:
- Rotas `/api/master/*` exigem sessão de mestre; caso contrário retornam **401** `{"error":"Não autenticado."}`.
- **O servidor não calcula nada.** A DT da missão é o valor informado pelo mestre.
- Não há mascaramento: a leitura pública devolve os mesmos dados que o mestre publicou.

---

## Autenticação (`/api/auth`)

| Método | Rota | Efeito |
|---|---|---|
| POST | `/api/auth/login` | `{senha}` → `{ok:true}` / `401` / `500` |
| POST | `/api/auth/logout` | `{ok:true}` |
| GET | `/api/auth/status` | `{master: bool}` |

---

## Leitura (`/api/public`) — sem autenticação

### `GET /api/public/estado`

```json
{
  "estado": { "ciclo": 1, "madeira": 0, "pedra": 0, "metais": 2, "suprimentos": 4 },
  "tropas": [
    { "id": "matilha", "nome": "Tropa da Matilha", "descricao": "Lobisomens civilizados.", "quantidade": 1 }
  ],
  "locais": [
    { "id": "krezk", "nome": "Krezk", "status": "Livre", "x": 8, "y": 22 }
  ],
  "aliados": [
    { "id": "marius", "nome": "Marius", "bonus": "+2 em Controle", "habilidade": "Bastião: ..." }
  ]
}
```

`status` ∈ `Livre`, `Neutro`, `Hostil`.

### `GET /api/public/missoes`

```json
[
  {
    "id": "a1b2c3d",
    "nome": "Assegurar rota",
    "tipo": "C",
    "local": "Vallaki",
    "dt": 17,
    "notas": "",
    "tropas": [ { "id": "dragoes", "nome": "Cavaleiros Dragões", "quantidade": 1 } ],
    "aliados": [ { "id": "marius", "nome": "Marius", "bonus": "+2 em Controle" } ]
  }
]
```

---

## Escrita (`/api/master`) — requer sessão

### `POST /api/master/estado`
Atualiza `ciclo`, `madeira`, `pedra`, `metais`, `suprimentos` (inteiros ≥ 0; `ciclo` mínimo 1).
```json
{ "ciclo": 2, "madeira": 1 }
```
- `200` → `{ "ok": true }`

### `GET /api/master/export`
Backup completo: `{ estado, tropas, locais, missoes }`.

### Locais
| Método | Rota | Corpo |
|---|---|---|
| POST | `/api/master/locais` | `{nome, status?, x?, y?}` → `201 {id, ok}` |
| PUT | `/api/master/locais/<id>` | parcial (`nome`, `status`, `x`, `y`) → `{ok}` |
| DELETE | `/api/master/locais/<id>` | `{ok}` |

`status` só aceita `Livre`, `Neutro` ou `Hostil` (`400` caso contrário). Ao remover um local, missões associadas ficam com `local_id = null`.

### Tropas
| Método | Rota | Corpo |
|---|---|---|
| POST | `/api/master/tropas` | `{nome, descricao?, quantidade?}` → `201 {id, ok}` |
| PUT | `/api/master/tropas/<id>` | parcial (`nome`, `descricao`, `quantidade`) → `{ok}` |
| DELETE | `/api/master/tropas/<id>` | `{ok}` — `400` se em uso por missão |

### Aliados
| Método | Rota | Corpo |
|---|---|---|
| POST | `/api/master/aliados` | `{nome, bonus?, habilidade?}` → `201 {id, ok}` |
| PUT | `/api/master/aliados/<id>` | parcial (`nome`, `bonus`, `habilidade`) → `{ok}` |
| DELETE | `/api/master/aliados/<id>` | `{ok}` |

> Aliados são apenas informativos: o app não calcula bônus.

### Missões
| Método | Rota | Corpo |
|---|---|---|
| POST | `/api/master/missoes` | `{nome, tipo, local_id?, dt, notas?, tropas?, aliados?}` → `201 {id, ok}` |
| PUT | `/api/master/missoes/<id>` | parcial → `{ok}` |
| DELETE | `/api/master/missoes/<id>` | `{ok}` |

- `nome` e `tipo` (`B`/`R`/`C`) são obrigatórios.
- **`dt` é obrigatório** (`400 {"error":"Informe a DT."}` se ausente).
- `tropas` é um mapa `{ tropa_id: quantidade }`.
- `aliados` é uma lista de ids de aliados (informativo).

---

## Glossário

| Termo | Significado |
|---|---|
| **DT** | Dificuldade Total — valor informado pelo mestre |
| **Tipo** | `B` Busca, `R` Reconhecimento, `C` Controle |
| **Local** | Ponto no mapa (nome, status, x/y em %) |
| **Recurso** | Contador (Madeira, Pedra, Metais, Suprimentos) |
