import uuid
from functools import wraps

from flask import Blueprint, jsonify, request, session
from sqlalchemy import select

from db import get_db
from models import Aliado, Estado, Local, Missao, MissaoAliado, MissaoTropa, Tropa

bp = Blueprint('master', __name__, url_prefix='/api/master')

STATUS_VALIDOS = {'Livre', 'Neutro', 'Hostil'}
TIPOS_VALIDOS = {'B', 'R', 'C'}


def requer_mestre(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get('master'):
            return jsonify({'error': 'Não autenticado.'}), 401
        return f(*args, **kwargs)
    return wrapper


def _int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


# ---------------------------------------------------------------------------
# Estado
# ---------------------------------------------------------------------------
@bp.post('/estado')
@requer_mestre
def atualizar_estado():
    data = request.get_json(silent=True) or {}
    db = get_db()
    est = db.get(Estado, 1)
    for campo in ('ciclo', 'madeira', 'pedra', 'metais', 'suprimentos'):
        if campo in data:
            setattr(est, campo, max(0, _int(data[campo], getattr(est, campo))))
    if est.ciclo < 1:
        est.ciclo = 1
    db.commit()
    return jsonify({'ok': True})


# ---------------------------------------------------------------------------
# Locais
# ---------------------------------------------------------------------------
@bp.post('/locais')
@requer_mestre
def criar_local():
    data = request.get_json(silent=True) or {}
    if not data.get('nome'):
        return jsonify({'error': 'Informe o nome.'}), 400
    if data.get('status', 'Neutro') not in STATUS_VALIDOS:
        return jsonify({'error': 'Status inválido.'}), 400

    db = get_db()
    novo = Local(
        id=data.get('id') or uuid.uuid4().hex[:8],
        nome=data['nome'],
        status=data.get('status', 'Neutro'),
        x=float(data.get('x', 50)),
        y=float(data.get('y', 50)),
    )
    db.add(novo)
    db.commit()
    return jsonify({'id': novo.id, 'ok': True}), 201


@bp.put('/locais/<lid>')
@requer_mestre
def atualizar_local(lid):
    data = request.get_json(silent=True) or {}
    db = get_db()
    loc = db.get(Local, lid)
    if not loc:
        return jsonify({'error': 'Local não encontrado.'}), 404
    if 'nome' in data:
        loc.nome = data['nome']
    if 'status' in data:
        if data['status'] not in STATUS_VALIDOS:
            return jsonify({'error': 'Status inválido.'}), 400
        loc.status = data['status']
    if 'x' in data:
        loc.x = min(100.0, max(0.0, float(data['x'])))
    if 'y' in data:
        loc.y = min(100.0, max(0.0, float(data['y'])))
    db.commit()
    return jsonify({'ok': True})


@bp.delete('/locais/<lid>')
@requer_mestre
def deletar_local(lid):
    db = get_db()
    loc = db.get(Local, lid)
    if not loc:
        return jsonify({'error': 'Local não encontrado.'}), 404
    db.delete(loc)
    db.commit()
    return jsonify({'ok': True})


# ---------------------------------------------------------------------------
# Tropas
# ---------------------------------------------------------------------------
@bp.post('/tropas')
@requer_mestre
def criar_tropa():
    data = request.get_json(silent=True) or {}
    if not data.get('nome'):
        return jsonify({'error': 'Informe o nome.'}), 400

    db = get_db()
    tid = data.get('id') or uuid.uuid4().hex[:8]
    if db.get(Tropa, tid):
        return jsonify({'error': 'Já existe uma tropa com esse id.'}), 400

    t = Tropa(
        id=tid,
        nome=data['nome'],
        descricao=data.get('descricao', ''),
        quantidade=max(0, _int(data.get('quantidade'), 0)),
    )
    db.add(t)
    db.commit()
    return jsonify({'id': t.id, 'ok': True}), 201


@bp.put('/tropas/<tid>')
@requer_mestre
def atualizar_tropa(tid):
    data = request.get_json(silent=True) or {}
    db = get_db()
    t = db.get(Tropa, tid)
    if not t:
        return jsonify({'error': 'Tropa não encontrada.'}), 404
    if 'nome' in data:
        t.nome = data['nome']
    if 'descricao' in data:
        t.descricao = data['descricao']
    if 'quantidade' in data:
        t.quantidade = max(0, _int(data['quantidade'], t.quantidade))
    db.commit()
    return jsonify({'ok': True})


@bp.delete('/tropas/<tid>')
@requer_mestre
def deletar_tropa(tid):
    db = get_db()
    t = db.get(Tropa, tid)
    if not t:
        return jsonify({'error': 'Tropa não encontrada.'}), 404
    em_uso = db.scalars(
        select(MissaoTropa).where(MissaoTropa.tropa_id == tid)
    ).all()
    if em_uso:
        return jsonify({'error': 'Tropa em uso por uma ou mais missões.'}), 400
    db.delete(t)
    db.commit()
    return jsonify({'ok': True})


# ---------------------------------------------------------------------------
# Aliados (informativo)
# ---------------------------------------------------------------------------
@bp.post('/aliados')
@requer_mestre
def criar_aliado():
    data = request.get_json(silent=True) or {}
    if not data.get('nome'):
        return jsonify({'error': 'Informe o nome.'}), 400

    db = get_db()
    aid = data.get('id') or uuid.uuid4().hex[:8]
    if db.get(Aliado, aid):
        return jsonify({'error': 'Já existe um aliado com esse id.'}), 400

    a = Aliado(
        id=aid,
        nome=data['nome'],
        bonus=data.get('bonus', ''),
        habilidade=data.get('habilidade', ''),
    )
    db.add(a)
    db.commit()
    return jsonify({'id': a.id, 'ok': True}), 201


@bp.put('/aliados/<aid>')
@requer_mestre
def atualizar_aliado(aid):
    data = request.get_json(silent=True) or {}
    db = get_db()
    a = db.get(Aliado, aid)
    if not a:
        return jsonify({'error': 'Aliado não encontrado.'}), 404
    if 'nome' in data:
        a.nome = data['nome']
    if 'bonus' in data:
        a.bonus = data['bonus']
    if 'habilidade' in data:
        a.habilidade = data['habilidade']
    db.commit()
    return jsonify({'ok': True})


@bp.delete('/aliados/<aid>')
@requer_mestre
def deletar_aliado(aid):
    db = get_db()
    a = db.get(Aliado, aid)
    if not a:
        return jsonify({'error': 'Aliado não encontrado.'}), 404
    db.delete(a)
    db.commit()
    return jsonify({'ok': True})


# ---------------------------------------------------------------------------
# Missões
# ---------------------------------------------------------------------------
@bp.post('/missoes')
@requer_mestre
def criar_missao():
    data = request.get_json(silent=True) or {}
    if not data.get('nome') or data.get('tipo') not in TIPOS_VALIDOS:
        return jsonify({'error': 'Nome e tipo são obrigatórios.'}), 400
    if 'dt' not in data:
        return jsonify({'error': 'Informe a DT.'}), 400

    db = get_db()
    local_id = data.get('local_id') or None
    if local_id and not db.get(Local, local_id):
        return jsonify({'error': 'Local não encontrado.'}), 400

    mid = data.get('id') or uuid.uuid4().hex[:8]
    m = Missao(
        id=mid,
        nome=data['nome'],
        tipo=data['tipo'],
        local_id=local_id,
        dt=max(1, _int(data['dt'], 10)),
        notas=data.get('notas', ''),
    )
    m.tropas = [
        MissaoTropa(tropa_id=tid, quantidade=_int(qtd, 0))
        for tid, qtd in (data.get('tropas') or {}).items()
        if _int(qtd, 0) > 0
    ]
    validos = {a.id for a in db.scalars(select(Aliado)).all()}
    m.aliados = [
        MissaoAliado(aliado_id=aid)
        for aid in (data.get('aliados') or [])
        if aid in validos
    ]
    db.add(m)
    db.commit()
    return jsonify({'id': mid, 'ok': True}), 201


@bp.put('/missoes/<mid>')
@requer_mestre
def atualizar_missao(mid):
    data = request.get_json(silent=True) or {}
    db = get_db()
    m = db.get(Missao, mid)
    if not m:
        return jsonify({'error': 'Missão não encontrada.'}), 404

    if 'tipo' in data and data['tipo'] not in TIPOS_VALIDOS:
        return jsonify({'error': 'Tipo inválido.'}), 400
    if 'local_id' in data:
        local_id = data['local_id'] or None
        if local_id and not db.get(Local, local_id):
            return jsonify({'error': 'Local não encontrado.'}), 400
        m.local_id = local_id

    if 'nome' in data:
        m.nome = data['nome']
    if 'tipo' in data:
        m.tipo = data['tipo']
    if 'dt' in data:
        m.dt = max(1, _int(data['dt'], m.dt))
    if 'notas' in data:
        m.notas = data['notas']
    if 'tropas' in data:
        m.tropas = [
            MissaoTropa(tropa_id=tid, quantidade=_int(qtd, 0))
            for tid, qtd in (data['tropas'] or {}).items()
            if _int(qtd, 0) > 0
        ]
    if 'aliados' in data:
        validos = {a.id for a in db.scalars(select(Aliado)).all()}
        m.aliados = [
            MissaoAliado(aliado_id=aid)
            for aid in (data['aliados'] or [])
            if aid in validos
        ]
    db.commit()
    return jsonify({'ok': True})


@bp.delete('/missoes/<mid>')
@requer_mestre
def deletar_missao(mid):
    db = get_db()
    m = db.get(Missao, mid)
    if not m:
        return jsonify({'error': 'Missão não encontrada.'}), 404
    db.delete(m)
    db.commit()
    return jsonify({'ok': True})


# ---------------------------------------------------------------------------
# Export — backup JSON
# ---------------------------------------------------------------------------
@bp.get('/export')
@requer_mestre
def exportar():
    db = get_db()
    est = db.get(Estado, 1)
    return jsonify({
        'estado': {
            'ciclo': est.ciclo, 'madeira': est.madeira, 'pedra': est.pedra,
            'metais': est.metais, 'suprimentos': est.suprimentos,
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
        'missoes': [
            {
                'id': m.id, 'nome': m.nome, 'tipo': m.tipo,
                'local_id': m.local_id, 'dt': m.dt, 'notas': m.notas,
                'tropas': {mt.tropa_id: mt.quantidade for mt in m.tropas},
                'aliados': [ma.aliado_id for ma in m.aliados],
            }
            for m in db.scalars(select(Missao)).all()
        ],
    })
