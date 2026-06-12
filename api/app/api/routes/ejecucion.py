from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.permissions import require_role
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.sistema import Usuario
from app.models.ciclo_gasto import Disponibilidad, ModificacionPresupuestaria
from app.models.seguimiento import AvanceFisico
from app.schemas.ejecucion import (
    DisponibilidadCreate, DisponibilidadOut,
    ModificacionPresupuestariaCreate, ModificacionPresupuestariaOut,
    AvanceFisicoCreate, AvanceFisicoOut
)
import uuid

router = APIRouter(prefix="/ejecucion", tags=["Ejecución Presupuestal"])

# ============ Disponibilidad (Módulo 6) ============

@router.post("/disponibilidad", response_model=DisponibilidadOut)
async def crear_disponibilidad(
    data: DisponibilidadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista")),
):
    disp = Disponibilidad(id=uuid.uuid4(), **data.model_dump())
    db.add(disp)
    await db.commit()
    await db.refresh(disp)
    return disp

@router.get("/disponibilidad", response_model=list[DisponibilidadOut])
async def listar_disponibilidad(
    entidad_id: str | None = None,
    estado: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = select(Disponibilidad).order_by(desc(Disponibilidad.fecha_solicitud))
    if entidad_id:
        query = query.where(Disponibilidad.entidad_id == entidad_id)
    if estado:
        query = query.where(Disponibilidad.estado == estado)
    
    result = await db.execute(query)
    return result.scalars().all()

# ============ Modificaciones Presupuestarias (Módulo 8) ============

@router.post("/modificacion", response_model=ModificacionPresupuestariaOut)
async def crear_modificacion(
    data: ModificacionPresupuestariaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista")),
):
    mod = ModificacionPresupuestaria(id=uuid.uuid4(), **data.model_dump())
    db.add(mod)
    await db.commit()
    await db.refresh(mod)
    return mod

@router.get("/modificacion", response_model=list[ModificacionPresupuestariaOut])
async def listar_modificaciones(
    entidad_id: str | None = None,
    tipo: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = select(ModificacionPresupuestaria).order_by(desc(ModificacionPresupuestaria.fecha_aprobacion))
    if entidad_id:
        query = query.where(ModificacionPresupuestaria.entidad_id == entidad_id)
    if tipo:
        query = query.where(ModificacionPresupuestaria.tipo_modificacion == tipo)
    
    result = await db.execute(query)
    return result.scalars().all()

# ============ Avance Físico (Módulo 10) ============

@router.post("/avance-fisico", response_model=AvanceFisicoOut)
async def registrar_avance_fisico(
    data: AvanceFisicoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    avance = AvanceFisico(id=uuid.uuid4(), **data.model_dump())
    db.add(avance)
    await db.commit()
    await db.refresh(avance)
    return avance

@router.get("/avance-fisico", response_model=list[AvanceFisicoOut])
async def listar_avances_fisicos(
    poi_id: str | None = None,
    anio: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = select(AvanceFisico).order_by(desc(AvanceFisico.anio_fiscal), desc(AvanceFisico.mes))
    if poi_id:
        query = query.where(AvanceFisico.poi_id == poi_id)
    if anio:
        query = query.where(AvanceFisico.anio_fiscal == anio)
    
    result = await db.execute(query)
    return result.scalars().all()