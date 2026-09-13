# Guia do Mestre

O painel do mestre concentra tudo em uma única página. O acesso é protegido por senha.

## Entrar

1. Acesse `http://SEU-SERVIDOR/mestre/login`.
2. Digite a senha e clique em **Entrar**.

Se a sessão expirar, você será redirecionado ao login.

## Barra superior

- **Ciclo** com `−`/`+` — avança/recua o contador global.
- **↓ Exportar** — baixa um backup JSON de todo o estado.
- **Sair** — encerra a sessão.

## Mapa

- **+ Local** cria um nó no centro do mapa.
- **Arraste** um nó para reposicioná-lo (a posição é salva ao soltar).
- **Clique** em um nó para editar nome/status ou removê-lo.
- Status: **Livre** (cream), **Neutro** (cinza), **Hostil** (coral).
- O número sobre o nó indica quantas missões partem dali.

## Missões

- **+ Missão** abre o formulário:
  - **Nome**, **Tipo** (Busca/Reconhecimento/Controle), **Ponto de apoio**.
  - **DT** — você digita o valor final. O app não calcula.
  - **Tropas alocadas** — marque e informe a quantidade.
  - **Aliados** — marque os aliados enviados (informativo, sem cálculo).
  - **Notas / Consequências**.
- Em cada card, os ícones **✎** (editar) e **✕** (remover).

## Tropas

- **+ Nova Tropa** cria uma tropa (nome, descrição, quantidade).
- Cada card tem `−`/`+` para o estoque, além de **✎** editar e **✕** remover.
- Uma tropa em uso por uma missão não pode ser removida.

## Aliados

- **+ Novo Aliado** cria um aliado.
- Cada card mostra **nome**, **bônus** (texto livre, ex.: "+2 em Controle") e **habilidade**, com **✎** editar e **✕** remover.
- É **apenas informativo**: o app não calcula nada a partir do bônus.

## Recursos

- **Madeira**, **Pedra**, **Metais** e **Suprimentos** usam os botões `−`/`+`.

## Backup

Clique em **↓ Exportar** para baixar `conselho-guerra-cicloN-AAAA-MM-DD.json`. Para restaurar, substitua o banco `instance/app.db` por um backup (ver [deploy.md](../ai-context/deploy.md)).

## Dica

O app é um mural: mantenha a **DT** e as **notas** atualizadas para os jogadores consultarem no celular durante a sessão.
