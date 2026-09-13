def test_missao_exige_dt(master_client):
    resposta = master_client.post('/api/master/missoes', json={
        'nome': 'Sem DT', 'tipo': 'B', 'tropas': {},
    })
    assert resposta.status_code == 400
    assert 'DT' in resposta.get_json()['error']


def test_missao_exige_nome_e_tipo(master_client):
    resposta = master_client.post('/api/master/missoes', json={'nome': '', 'tipo': 'X'})
    assert resposta.status_code == 400


def test_crud_missao(master_client):
    criacao = master_client.post('/api/master/missoes', json={
        'nome': 'Assegurar rota', 'tipo': 'C', 'local_id': 'vallaki',
        'dt': 17, 'notas': 'teste', 'tropas': {'dragoes': 1},
        'aliados': ['marius'],
    })
    assert criacao.status_code == 201
    mid = criacao.get_json()['id']

    missoes = {m['id']: m for m in master_client.get('/api/public/missoes').get_json()}
    assert missoes[mid]['dt'] == 17
    assert missoes[mid]['local'] == 'Vallaki'
    assert missoes[mid]['tropas'][0]['id'] == 'dragoes'
    assert missoes[mid]['aliados'][0]['nome'] == 'Marius'

    assert master_client.put(f'/api/master/missoes/{mid}', json={
        'dt': 20, 'aliados': ['elvira'],
    }).status_code == 200
    missoes = {m['id']: m for m in master_client.get('/api/public/missoes').get_json()}
    assert missoes[mid]['dt'] == 20
    assert missoes[mid]['aliados'][0]['nome'] == 'Elvira'

    assert master_client.delete(f'/api/master/missoes/{mid}').status_code == 200


def test_crud_local(master_client):
    criacao = master_client.post('/api/master/locais', json={
        'nome': 'Ruínas de Teste', 'status': 'Hostil', 'x': 30, 'y': 40,
    })
    assert criacao.status_code == 201
    lid = criacao.get_json()['id']

    assert master_client.put(f'/api/master/locais/{lid}', json={'status': 'Neutro'}).status_code == 200
    assert master_client.put(f'/api/master/locais/{lid}', json={'status': 'Infiltrado'}).status_code == 400
    assert master_client.delete(f'/api/master/locais/{lid}').status_code == 200


def test_crud_tropa(master_client):
    criacao = master_client.post('/api/master/tropas', json={
        'id': 'tropa-teste', 'nome': 'Tropa de Teste', 'descricao': 'd', 'quantidade': 2,
    })
    assert criacao.status_code == 201

    assert master_client.put('/api/master/tropas/tropa-teste', json={'quantidade': 5}).status_code == 200
    tropas = {t['id']: t for t in master_client.get('/api/public/estado').get_json()['tropas']}
    assert tropas['tropa-teste']['quantidade'] == 5

    assert master_client.delete('/api/master/tropas/tropa-teste').status_code == 200


def test_crud_aliado(master_client):
    criacao = master_client.post('/api/master/aliados', json={
        'id': 'aliado-teste', 'nome': 'Aliado de Teste',
        'bonus': '+2 em Controle', 'habilidade': 'Faz algo útil.',
    })
    assert criacao.status_code == 201

    assert master_client.put('/api/master/aliados/aliado-teste', json={
        'bonus': '+3 em Controle',
    }).status_code == 200

    aliados = {a['id']: a for a in master_client.get('/api/public/estado').get_json()['aliados']}
    assert aliados['aliado-teste']['nome'] == 'Aliado de Teste'
    assert aliados['aliado-teste']['bonus'] == '+3 em Controle'
    assert aliados['aliado-teste']['habilidade'] == 'Faz algo útil.'

    assert master_client.delete('/api/master/aliados/aliado-teste').status_code == 200


def test_exportar_backup(master_client):
    resposta = master_client.get('/api/master/export')
    assert resposta.status_code == 200
    dados = resposta.get_json()
    assert set(dados) == {'estado', 'tropas', 'locais', 'aliados', 'missoes'}
