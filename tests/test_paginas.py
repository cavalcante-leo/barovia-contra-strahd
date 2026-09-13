def test_pagina_publica(client):
    resposta = client.get('/')
    assert resposta.status_code == 200
    corpo = resposta.get_data(as_text=True)
    assert 'mapNodes' in corpo
    assert 'missoesList' in corpo
    assert 'tropasList' in corpo
    assert 'aliadosList' in corpo
    assert '/static/css/style.css' in corpo
    assert '/static/js/jogador.js' in corpo


def test_pagina_login(client):
    resposta = client.get('/mestre/login')
    assert resposta.status_code == 200
    assert 'Acesso do Mestre' in resposta.get_data(as_text=True)


def test_pagina_mestre_autenticado(master_client):
    resposta = master_client.get('/mestre/')
    assert resposta.status_code == 200
    corpo = resposta.get_data(as_text=True)
    assert 'btnNovaMissao' in corpo
    assert '/static/js/mestre.js' in corpo


def test_assets_estaticos(client):
    caminhos = (
        '/static/css/style.css',
        '/static/js/api.js',
        '/static/js/mapa.js',
        '/static/js/missoes.js',
        '/static/js/mestre.js',
        '/static/js/jogador.js',
        '/static/img/mapa-barovia.jpg',
    )
    for caminho in caminhos:
        assert client.get(caminho).status_code == 200, caminho
