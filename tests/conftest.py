import os
import tempfile

import pytest
from werkzeug.security import generate_password_hash

# Banco temporário e credenciais de teste ANTES de importar o app.
_tmp = tempfile.NamedTemporaryFile(prefix='conselho-test-', suffix='.db', delete=False)
_tmp.close()
os.environ['DB_PATH'] = _tmp.name
os.environ['SECRET_KEY'] = 'test-secret'
os.environ['MASTER_PASSWORD_HASH'] = generate_password_hash('mestre')

from app import app as flask_app  # noqa: E402
from db import SessionLocal, engine  # noqa: E402
from models import Aliado, Base, Local, Tropa, ensure_estado  # noqa: E402


@pytest.fixture(scope='session', autouse=True)
def _database():
    Base.metadata.create_all(engine)

    session = SessionLocal()
    try:
        ensure_estado(session)
        session.add(Local(id='vallaki', nome='Vallaki', status='Neutro', x=42, y=25))
        session.add(Tropa(id='dragoes', nome='Cavaleiros Dragões',
                          descricao='Treinados nos dogmas de Aurore.', quantidade=1))
        session.add(Aliado(id='marius', nome='Marius',
                           bonus='+2 em Controle', habilidade='Bastião.'))
        session.add(Aliado(id='elvira', nome='Elvira',
                           bonus='+2 em Controle', habilidade='Juri, Juíza e Executora.'))
        session.commit()
    finally:
        SessionLocal.remove()

    yield

    Base.metadata.drop_all(engine)
    SessionLocal.remove()
    engine.dispose()
    for sufixo in ('', '-wal', '-shm'):
        caminho = _tmp.name + sufixo
        if os.path.exists(caminho):
            os.unlink(caminho)


@pytest.fixture()
def client():
    flask_app.config.update(TESTING=True)
    with flask_app.test_client() as c:
        yield c


@pytest.fixture()
def master_client(client):
    resposta = client.post('/api/auth/login', json={'senha': 'mestre'})
    assert resposta.status_code == 200
    return client
