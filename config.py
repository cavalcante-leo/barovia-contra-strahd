import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

_db_override = os.getenv('DB_PATH')
_database_url = (os.getenv('DATABASE_URL') or os.getenv('connection_string') or '').strip()


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-troque-em-producao')
    MASTER_PASSWORD_HASH = os.getenv('MASTER_PASSWORD_HASH')

    # Banco: PostgreSQL/Supabase quando DATABASE_URL (ou connection_string) existir;
    # caso contrário, SQLite local em instance/app.db (dev/testes).
    DATABASE_URL = _database_url or None
    DB_PATH = Path(_db_override) if _db_override else BASE_DIR / 'instance' / 'app.db'

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = os.getenv('FLASK_ENV') == 'production'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=8)
