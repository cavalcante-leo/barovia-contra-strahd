from flask import g
from sqlalchemy import create_engine, event
from sqlalchemy.orm import scoped_session, sessionmaker

from config import Config

Config.DB_PATH.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    f'sqlite:///{Config.DB_PATH}',
    future=True,
    echo=False,
    connect_args={'check_same_thread': False},
)


@event.listens_for(engine, 'connect')
def _sqlite_pragmas(dbapi_conn, _record):
    cursor = dbapi_conn.cursor()
    cursor.execute('PRAGMA foreign_keys = ON')
    cursor.execute('PRAGMA journal_mode = WAL')
    cursor.execute('PRAGMA busy_timeout = 5000')
    cursor.close()


SessionLocal = scoped_session(
    sessionmaker(bind=engine, expire_on_commit=False, future=True)
)


def get_db():
    """Retorna a sessão da request atual (cria se ainda não existir)."""
    if 'db' not in g:
        g.db = SessionLocal()
    return g.db


def close_db(_exception=None):
    """Remove a sessão ao final da request."""
    SessionLocal.remove()
