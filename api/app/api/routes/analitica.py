from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, desc
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.sistema import Usuario
from app.models.operativas import Gasto, GastoResumenMensual
from app.models.dimensionales import Entidad
from app.models.seguimiento import Alerta
from app.schemas.analitica import KPIsEjecucion, EvolucionMensual, RankingEntidad, AlertaOut
from decimal import Decimal

router = APIRouter(prefix="/analitica", tags=["Analítica y Dashboards"])

MESES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", 
         "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

@router.get("/kpis", response_model=KPIsEjecucion)
async def kpis_principales(
    anio: int = Query(2026, description="Año fiscal"),
    entidad_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """KPIs principales del Dashboard"""
    query = select(
        func.sum(GastoResumenMensual.pia).label("pia"),
        func.sum(GastoResumenMensual.pim).label("pim"),
        func.sum(GastoResumenMensual.certificado).label("cert"),
        func.sum(GastoResumenMensual.comprometido).label("comp"),
        func.sum(GastoResumenMensual.devengado).label("dev"),
        func.sum(GastoResumenMensual.girado).label("gir"),
    ).where(GastoResumenMensual.anio_fiscal == anio)
    
    if entidad_id:
        query = query.where(GastoResumenMensual.entidad_id == entidad_id)
    
    result = await db.execute(query)
    row = result.one()
    
    pim = Decimal(row.pim or 0)
    dev = Decimal(row.dev or 0)
    pct = (dev / pim * 100) if pim > 0 else Decimal(0)
    
    # Contar entidades y alertas
    total_ent = await db.execute(
        select(func.count(func.distinct(GastoResumenMensual.entidad_id)))
        .where(GastoResumenMensual.anio_fiscal == anio)
    )
    
    alertas_rojas = await db.execute(
        select(func.count(Alerta.id)).where(Alerta.nivel == "rojo")
    )
    
    return KPIsEjecucion(
        pia_total=Decimal(row.pia or 0),
        pim_total=pim,
        certificado=Decimal(row.cert or 0),
        comprometido=Decimal(row.comp or 0),
        devengado=dev,
        girado=Decimal(row.gir or 0),
        porcentaje_ejecucion=pct,
        saldo_disponible=pim - dev,
        total_entidades=total_ent.scalar() or 0,
        alertas_rojas=alertas_rojas.scalar() or 0
    )

@router.get("/evolucion-mensual", response_model=list[EvolucionMensual])
async def evolucion_mensual(
    anio: int = Query(2026),
    entidad_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Serie de tiempo para gráfico de líneas (Recharts)"""
    query = select(
        GastoResumenMensual.mes,
        func.sum(GastoResumenMensual.devengado).label("dev"),
        func.sum(GastoResumenMensual.girado).label("gir"),
        func.sum(GastoResumenMensual.pim).label("pim"),
    ).where(GastoResumenMensual.anio_fiscal == anio)\
     .group_by(GastoResumenMensual.mes)\
     .order_by(GastoResumenMensual.mes)
    
    if entidad_id:
        query = query.where(GastoResumenMensual.entidad_id == entidad_id)
    
    result = await db.execute(query)
    rows = result.all()
    
    return [
        EvolucionMensual(
            anio=anio,
            mes=r.mes,
            mes_nombre=MESES[r.mes],
            devengado=Decimal(r.dev or 0),
            girado=Decimal(r.gir or 0),
            pim=Decimal(r.pim or 0)
        )
        for r in rows
    ]

@router.get("/ranking-entidades", response_model=list[RankingEntidad])
async def ranking_entidades(
    anio: int = Query(2026),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Top entidades por % de ejecución"""
    stmt = select(
        Entidad.nombre.label("nombre"),
        Entidad.ruc,
        func.sum(GastoResumenMensual.pim).label("pim"),
        func.sum(GastoResumenMensual.devengado).label("dev"),
    ).join(Entidad, GastoResumenMensual.entidad_id == Entidad.id)\
     .where(GastoResumenMensual.anio_fiscal == anio)\
     .group_by(Entidad.id, Entidad.nombre, Entidad.ruc)\
     .order_by(desc("dev"))\
     .limit(limit)
    
    result = await db.execute(stmt)
    rows = result.all()
    
    ranking = []
    for r in rows:
        pim = Decimal(r.pim or 0)
        dev = Decimal(r.dev or 0)
        pct = (dev / pim * 100) if pim > 0 else Decimal(0)
        ranking.append(RankingEntidad(
            entidad_nombre=r.nombre,
            ruc=r.ruc,
            pim=pim,
            devengado=dev,
            porcentaje=pct
        ))
    
    return ranking

@router.get("/alertas", response_model=list[AlertaOut])
async def alertas_activas(
    nivel: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Semáforo de alertas (Módulo 11)"""
    query = select(Alerta, Entidad.nombre.label("ent_nombre"))\
        .outerjoin(Entidad, Alerta.entidad_id == Entidad.id)\
        .where(Alerta.estado == "activa")\
        .order_by(
            case(
                (Alerta.nivel == "rojo", 1),
                (Alerta.nivel == "amarillo", 2),
                else_=3
            ),
            desc(Alerta.fecha_deteccion)
        )\
        .limit(limit)
    
    if nivel:
        query = query.where(Alerta.nivel == nivel)
    
    result = await db.execute(query)
    
    return [
        AlertaOut(
            tipo_alerta=row.Alerta.tipo_alerta,
            nivel=row.Alerta.nivel,
            mensaje=row.Alerta.mensaje,
            entidad_nombre=row.ent_nombre
        )
        for row in result.all()
    ]