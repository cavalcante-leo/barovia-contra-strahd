"""Popula o banco com os dados iniciais (idempotente)."""

from db import SessionLocal
from models import Aliado, Estado, Local, Tropa

TROPAS = [
    {'id': 'matilha',     'nome': 'Tropa da Matilha',        'descricao': 'Lobisomens civilizados.',              'quantidade': 1},
    {'id': 'mortosvivos', 'nome': 'Cavaleiros Mortos-Vivos', 'descricao': 'Cavaleiros do Silvado.',                'quantidade': 0},
    {'id': 'coletores',   'nome': 'Coletores de Vallaki',    'descricao': 'Milícia local.',                        'quantidade': 0},
    {'id': 'dragoes',     'nome': 'Cavaleiros Dragões',      'descricao': 'Treinados nos dogmas de Aurore.',       'quantidade': 1},
    {'id': 'pena',        'nome': 'Guardiões da Pena',       'descricao': 'Corvos licantropos.',                   'quantidade': 1},
]

LOCAIS = [
    {'id': 'krezk',     'nome': 'Krezk',           'status': 'Livre',  'x': 8,  'y': 22},
    {'id': 'vallaki',   'nome': 'Vallaki',         'status': 'Neutro', 'x': 42, 'y': 25},
    {'id': 'vinhedo',   'nome': 'Vinhedo',         'status': 'Livre',  'x': 9,  'y': 44},
    {'id': 'silvado',   'nome': 'Silvado',         'status': 'Hostil', 'x': 32, 'y': 58},
    {'id': 'berez',     'nome': 'Berez',           'status': 'Hostil', 'x': 24, 'y': 80},
    {'id': 'ravenloft', 'nome': 'Ravenloft',       'status': 'Hostil', 'x': 82, 'y': 40},
    {'id': 'barovia',   'nome': 'Vila de Baróvia', 'status': 'Neutro', 'x': 88, 'y': 58},
    {'id': 'karstein',  'nome': 'Karstein',        'status': 'Hostil', 'x': 84, 'y': 8},
]

ALIADOS = [
    {'id': 'marius',      'nome': 'Marius',      'bonus': '+2 em Controle',     'habilidade': 'Bastião: se a missão de Controle falha, segura a linha de frente.'},
    {'id': 'elvira',      'nome': 'Elvira',      'bonus': '+2 em Controle',     'habilidade': 'Juri, Juíza e Executora: com Cavaleiros Dragões concede +1 e reduz a influência de Strahd.'},
    {'id': 'vlad',        'nome': 'Vlad',        'bonus': '—',                   'habilidade': 'Serviço de Entregas do Vlad: Reconhecimento com facção aliada tem sucesso automático.'},
    {'id': 'melissa',     'nome': 'Melissa',     'bonus': '+4 em Controle',     'habilidade': 'Loba Alpha: como Líder da Matilha, aumenta o bônus e protege a tropa em caso de falha.'},
    {'id': 'bartholomeu', 'nome': 'Bartholomeu', 'bonus': '+2 Reconhecimento',  'habilidade': 'Aparência Morta: +2 em Reconhecimento contra forças de Anastasya.'},
    {'id': 'ezmerelda',   'nome': 'Ezmerelda',   'bonus': '+2 em Controle',     'habilidade': 'Arranca Presas: +1 contra forças de Strahd comandadas por vampiros e reduz a influência.'},
    {'id': 'vanritchen',  'nome': 'Van Richten', 'bonus': '+2 Reconhecimento',  'habilidade': 'Conhecimento Aplicado: revela a quantidade exata de tropas da facção em sucesso.'},
    {'id': 'madalena',    'nome': 'Madalena',    'bonus': '—',                   'habilidade': 'Engenharia de Ponta: a cada 2 ciclos entrega um novo item em troca de 2 metais.'},
    {'id': 'astyanax',    'nome': 'Astyanax',    'bonus': '—',                   'habilidade': 'Medo da Solidão: não pode ser enviado em missões que não envolvam Selenia ou Kael.'},
]


def seed():
    session = SessionLocal()
    try:
        if session.get(Estado, 1) is None:
            session.add(Estado(id=1, ciclo=1, madeira=0, pedra=0, metais=2, suprimentos=4))

        for dados in TROPAS:
            if session.get(Tropa, dados['id']) is None:
                session.add(Tropa(**dados))

        for dados in LOCAIS:
            if session.get(Local, dados['id']) is None:
                session.add(Local(**dados))

        for dados in ALIADOS:
            if session.get(Aliado, dados['id']) is None:
                session.add(Aliado(**dados))

        session.commit()
        print('[seed] Dados iniciais garantidos.')
    finally:
        SessionLocal.remove()


if __name__ == '__main__':
    seed()
