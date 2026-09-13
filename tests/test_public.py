def test_estado_publico(client):
    resposta = client.get('/api/public/estado')
    assert resposta.status_code == 200

    dados = resposta.get_json()
    assert set(dados['estado']) >= {'ciclo', 'madeira', 'pedra', 'metais', 'suprimentos'}
    assert isinstance(dados['tropas'], list)
    assert isinstance(dados['locais'], list)
    assert isinstance(dados['aliados'], list)

    if dados['aliados']:
        aliado = dados['aliados'][0]
        assert set(aliado) == {'id', 'nome', 'bonus', 'habilidade'}

    local = dados['locais'][0]
    assert set(local) == {'id', 'nome', 'status', 'x', 'y'}
    assert local['status'] in ('Livre', 'Neutro', 'Hostil')


def test_missoes_publicas(client):
    resposta = client.get('/api/public/missoes')
    assert resposta.status_code == 200
    assert isinstance(resposta.get_json(), list)
