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
from models import Base  # noqa: E402
from seed import seed  # noqa: E402


@pytest.fixture(scope='session', autouse=True)
def _database():
    Base.metadata.create_all(engine)
    seed()
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
