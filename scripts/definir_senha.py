"""Define a senha do mestre e atualiza o hash no arquivo .env.

Uso:
    python scripts/definir_senha.py "nova-senha"

O hash é gerado pelo Werkzeug (formato ``scrypt:...$salt$hash``) e gravado
diretamente em ``.env`` — nunca em texto puro.
"""

import re
import sys
from pathlib import Path

from werkzeug.security import generate_password_hash

RAIZ = Path(__file__).resolve().parent.parent
ENV = RAIZ / '.env'


def atualizar_env(novo_hash: str) -> None:
    texto = ENV.read_text(encoding='utf-8')
    linha = f'MASTER_PASSWORD_HASH={novo_hash}'
    if re.search(r'^MASTER_PASSWORD_HASH=.*$', texto, flags=re.MULTILINE):
        texto = re.sub(r'^MASTER_PASSWORD_HASH=.*$', linha, texto, flags=re.MULTILINE)
    else:
        texto = texto.rstrip('\n') + '\n' + linha + '\n'
    ENV.write_text(texto, encoding='utf-8')


def main() -> None:
    if len(sys.argv) != 2 or not sys.argv[1]:
        print('Uso: python scripts/definir_senha.py "nova-senha"')
        raise SystemExit(1)

    if not ENV.exists():
        print('Arquivo .env não encontrado. Copie .env.example para .env primeiro.')
        raise SystemExit(1)

    atualizar_env(generate_password_hash(sys.argv[1]))
    print('Senha do mestre atualizada em .env. Reinicie o servidor.')


if __name__ == '__main__':
    main()
