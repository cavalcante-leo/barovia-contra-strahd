import os

from flask import Flask, redirect, render_template, session, url_for

from api import auth, master, public
from config import Config
from db import get_db, close_db
from models import ensure_estado

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config.from_object(Config)
app.teardown_appcontext(close_db)

app.register_blueprint(auth.bp)
app.register_blueprint(public.bp)
app.register_blueprint(master.bp)


@app.before_request
def _garantir_estado():
    """Garante a linha única de Estado em qualquer forma de inicialização.

    É idempotente: cria apenas se não existir e nunca sobrescreve dados.
    """
    ensure_estado(get_db())


@app.route('/')
def raiz():
    return render_template('jogador/index.html')


@app.route('/mestre/login')
def mestre_login():
    return render_template('mestre/login.html')


@app.route('/mestre/')
def mestre_index():
    if not session.get('master'):
        return redirect(url_for('mestre_login'))
    return render_template('mestre/index.html')


if __name__ == '__main__':
    porta = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(debug=debug, host='0.0.0.0', port=porta)
