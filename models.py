from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass

class Estado(Base):
    """Linha única de estado global (id = 1)."""

    __tablename__ = 'estado'
    __table_args__ = (CheckConstraint('id = 1', name='ck_estado_single'),)

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    ciclo: Mapped[int] = mapped_column(Integer, default=1)
    madeira: Mapped[int] = mapped_column(Integer, default=0)
    pedra: Mapped[int] = mapped_column(Integer, default=0)
    metais: Mapped[int] = mapped_column(Integer, default=0)
    suprimentos: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

def ensure_estado(db) -> Estado:
    """Busca ou cria a única linha de Estado (idempotente; nunca reseta dados)."""
    est = db.get(Estado, 1)
    if est is None:
        est = Estado(id=1)
        db.add(est)
        db.commit()
    return est

class Tropa(Base):
    """Catálogo de tropas + estoque."""

    __tablename__ = 'tropas'
    __table_args__ = (CheckConstraint('quantidade >= 0', name='ck_tropa_qtd'),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    nome: Mapped[str] = mapped_column(String)
    descricao: Mapped[str] = mapped_column(String, default='')
    quantidade: Mapped[int] = mapped_column(Integer, default=0)


class Aliado(Base):
    """Catálogo de aliados — apenas informativo (nome, bônus e habilidade)."""

    __tablename__ = 'aliados'

    id: Mapped[str] = mapped_column(String, primary_key=True)
    nome: Mapped[str] = mapped_column(String)
    bonus: Mapped[str] = mapped_column(String, default='')
    habilidade: Mapped[str] = mapped_column(String, default='')


class Local(Base):
    """Locais no mapa (x/y em %)."""

    __tablename__ = 'locais'
    __table_args__ = (
        CheckConstraint(
            "status IN ('Livre','Neutro','Hostil')",
            name='ck_local_status',
        ),
        CheckConstraint('x >= 0 AND x <= 100', name='ck_local_x'),
        CheckConstraint('y >= 0 AND y <= 100', name='ck_local_y'),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True)
    nome: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default='Neutro')
    x: Mapped[float] = mapped_column(Float)
    y: Mapped[float] = mapped_column(Float)


class Missao(Base):
    """Missão — a DT é digitada pelo mestre."""

    __tablename__ = 'missoes'
    __table_args__ = (
        CheckConstraint("tipo IN ('B','R','C')", name='ck_missao_tipo'),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True)
    nome: Mapped[str] = mapped_column(String)
    tipo: Mapped[str] = mapped_column(String)
    local_id: Mapped[str | None] = mapped_column(
        ForeignKey('locais.id', ondelete='SET NULL'), nullable=True
    )
    dt: Mapped[int] = mapped_column(Integer)
    notas: Mapped[str] = mapped_column(String, default='')
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    local: Mapped[Local | None] = relationship(lazy='joined')
    tropas: Mapped[list['MissaoTropa']] = relationship(
        back_populates='missao',
        cascade='all, delete-orphan',
        lazy='selectin',
    )
    aliados: Mapped[list['MissaoAliado']] = relationship(
        back_populates='missao',
        cascade='all, delete-orphan',
        lazy='selectin',
    )


class MissaoTropa(Base):
    """N:N — tropas alocadas por missão (com quantidade)."""

    __tablename__ = 'missao_tropas'
    __table_args__ = (CheckConstraint('quantidade > 0', name='ck_mt_qtd'),)

    missao_id: Mapped[str] = mapped_column(
        ForeignKey('missoes.id', ondelete='CASCADE'), primary_key=True
    )
    tropa_id: Mapped[str] = mapped_column(
        ForeignKey('tropas.id'), primary_key=True
    )
    quantidade: Mapped[int] = mapped_column(Integer, default=1)

    missao: Mapped[Missao] = relationship(back_populates='tropas')
    tropa: Mapped[Tropa] = relationship(lazy='joined')


class MissaoAliado(Base):
    """N:N — aliados alocados por missão (informativo)."""

    __tablename__ = 'missao_aliados'

    missao_id: Mapped[str] = mapped_column(
        ForeignKey('missoes.id', ondelete='CASCADE'), primary_key=True
    )
    aliado_id: Mapped[str] = mapped_column(
        ForeignKey('aliados.id'), primary_key=True
    )

    missao: Mapped[Missao] = relationship(back_populates='aliados')
    aliado: Mapped[Aliado] = relationship(lazy='joined')
