from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash

from config import Config

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.post('/login')
def login():
    data = request.get_json(silent=True) or {}
    senha = data.get('senha', '')

    if not Config.MASTER_PASSWORD_HASH:
        return jsonify({'error': 'Mestre não configurado no servidor.'}), 500

    try:
        valido = check_password_hash(Config.MASTER_PASSWORD_HASH, senha)
    except ValueError:
        # Hash malformado no .env — trata como credencial inválida.
        valido = False

    if not valido:
        return jsonify({'error': 'Senha inválida.'}), 401

    session.permanent = True
    session['master'] = True
    return jsonify({'ok': True})


@bp.post('/logout')
def logout():
    session.clear()
    return jsonify({'ok': True})


@bp.get('/status')
def status():
    return jsonify({'master': bool(session.get('master'))})
