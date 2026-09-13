def test_master_sem_login_recebe_401(client):
    resposta = client.post('/api/master/estado', json={'ciclo': 2})
    assert resposta.status_code == 401


def test_login_com_senha_errada(client):
    resposta = client.post('/api/auth/login', json={'senha': 'errada'})
    assert resposta.status_code == 401


def test_login_e_escrita(master_client):
    assert master_client.get('/api/auth/status').get_json()['master'] is True
    resposta = master_client.post('/api/master/estado', json={'ciclo': 2})
    assert resposta.status_code == 200


def test_logout_encerra_sessao(client):
    client.post('/api/auth/login', json={'senha': 'mestre'})
    client.post('/api/auth/logout')
    assert client.post('/api/master/estado', json={'ciclo': 1}).status_code == 401


def test_pagina_mestre_redireciona_sem_login(client):
    resposta = client.get('/mestre/')
    assert resposta.status_code == 302
    assert '/mestre/login' in resposta.headers['Location']


def test_hash_malformado_retorna_401(client, monkeypatch):
    from config import Config

    monkeypatch.setattr(Config, 'MASTER_PASSWORD_HASH', 'scrypt:scrypt:32768:8:1$x$y')
    resposta = client.post('/api/auth/login', json={'senha': 'mestre'})
    assert resposta.status_code == 401
