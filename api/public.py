from flask import Blueprint, jsonify
from sqlalchemy import select

from db import get_db
from models import Aliado, Estado, Local, Missao, Tropa, ensure_estado

bp = Blueprint('public', __name__, url_prefix='/api/public')

@bp.get('/estado')
def estado():
    db = get_db()
    est = ensure_estado(db)

    return jsonify({
        'estado': {
            'ciclo': est.ciclo,
            'madeira': est.madeira,
            'pedra': est.pedra,
            'metais': est.metais,
            'suprimentos': est.suprimentos,
        },
        'tropas': [
            {'id': t.id, 'nome': t.nome, 'descricao': t.descricao,
             'quantidade': t.quantidade}
            for t in db.scalars(select(Tropa)).all()
        ],
        'locais': [
            {'id': l.id, 'nome': l.nome, 'status': l.status, 'x': l.x, 'y': l.y}
            for l in db.scalars(select(Local)).all()
        ],
        'aliados': [
            {'id': a.id, 'nome': a.nome, 'bonus': a.bonus, 'habilidade': a.habilidade}
            for a in db.scalars(select(Aliado)).all()
        ],
    })


@bp.get('/missoes')
def missoes():
    db = get_db()
    rows = db.scalars(select(Missao).order_by(Missao.created_at.desc())).all()
    return jsonify([
        {
            'id': m.id,
            'nome': m.nome,
            'tipo': m.tipo,
            'local': m.local.nome if m.local else None,
            'dt': m.dt,
            'notas': m.notas,
            'tropas': [
                {'id': mt.tropa_id, 'nome': mt.tropa.nome, 'quantidade': mt.quantidade}
                for mt in m.tropas
            ],
            'aliados': [
                {'id': ma.aliado_id, 'nome': ma.aliado.nome, 'bonus': ma.aliado.bonus}
                for ma in m.aliados
            ],
        }
        for m in rows
    ])
