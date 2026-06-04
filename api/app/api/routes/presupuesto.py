from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.permissions import require_role
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.sistema import Usuario
from app.models.estrategicas import Presupuesto
from app.models.ciclo_gasto import ProgramacionMultianual
from app.schemas.presupuesto import (
    PresupuestoCreate, PresupuestoUpdate, PresupuestoOut,
    ProgramacionMultianualCreate, ProgramacionMultianualOut
)
import uuid

router = APIRouter(prefix="/presupuesto", tags=["Presupuesto"])

# ============ Programación Multianual (Módulo 4) ============

@router.post("/programacion", response_model=ProgramacionMultianualOut)
async def crear_programacion(
    data: ProgramacionMultianualCreate,
    db: AsyncSession = Depends(get_db),
    roles: list[str] = Depends(require_role("Administrador", "Analista"))
):
    prog = ProgramacionMultianual(id=uuid.uuid4(), **data.model_dump())
    db.add(prog)
    await db.commit()
    await db.refresh(prog)
    return prog

@router.get("/programacion", response_model=list[ProgramacionMultianualOut])
async def listar_programacion(
    entidad_id: str | None = None,
    anio: int | None = None,
    db: AsyncSession = Depends(get_db),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = select(ProgramacionMultianual).order_by(desc(ProgramacionMultianual.creado_en))
    if entidad_id:
        query = query.where(ProgramacionMultianual.entidad_id == entidad_id)
    if anio:
        query = query.where(ProgramacionMultianual.anio_programacion == anio)
    
    result = await db.execute(query)
    return result.scalars().all()

# ============ Presupuesto Institucional (Módulo 5) ============

@router.post("/", response_model=PresupuestoOut)
async def crear_presupuesto(
    data: PresupuestoCreate,
    db: AsyncSession = Depends(get_db),
    roles: list[str] = Depends(require_role("Administrador", "Analista"))
):
    presupuesto = Presupuesto(id=uuid.uuid4(), **data.model_dump())
    db.add(presupuesto)
    await db.commit()
    await db.refresh(presupuesto)
    return presupuesto

@router.get("/", response_model=list[PresupuestoOut])
async def listar_presupuestos(
    entidad_id: str | None = None,
    anio: int | None = None,
    poi_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = select(Presupuesto).order_by(desc(Presupuesto.creado_en))
    if entidad_id:
        query = query.where(Presupuesto.entidad_id == entidad_id)
    if anio:
        query = query.where(Presupuesto.anio_fiscal == anio)
    if poi_id:
        query = query.where(Presupuesto.poi_id == poi_id)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{presupuesto_id}", response_model=PresupuestoOut)
async def obtener_presupuesto(
    presupuesto_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    result = await db.execute(select(Presupuesto).where(Presupuesto.id == presupuesto_id))
    presupuesto = result.scalar_one_or_none()
    if not presupuesto:
        raise HTTPException(404, "Presupuesto no encontrado")
    return presupuesto

@router.put("/{presupuesto_id}", response_model=PresupuestoOut)
async def actualizar_presupuesto(
    presupuesto_id: uuid.UUID,
    data: PresupuestoUpdate,
    db: AsyncSession = Depends(get_db),
    roles: list[str] = Depends(require_role("Administrador", "Analista"))
):
    result = await db.execute(select(Presupuesto).where(Presupuesto.id == presupuesto_id))
    presupuesto = result.scalar_one_or_none()
    if not presupuesto:
        raise HTTPException(404, "Presupuesto no encontrado")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(presupuesto, key, value)
    
    await db.commit()
    await db.refresh(presupuesto)
    return presupuesto