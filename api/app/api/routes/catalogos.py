from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, select
from app.core.permissions import require_role
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.sistema import Usuario
from app.models.dimensionales import Entidad, CentroCosto, ClasificacionGasto, FuenteDatos
from app.schemas.catalogo import EntidadOut, CentroCostoOut, ClasificadorOut, EntidadCreate, EntidadUpdate
from sqlalchemy.orm import selectinload
import uuid

from app.models.dimensionales import FuenteDatos
from app.schemas.catalogo import FuenteDatosOut

router = APIRouter(prefix="/catalogos", tags=["Catálogos"])

@router.get("/entidades")
async def listar_entidades(
    activo: str = Query("true", description="true, false, o all"),
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    """Lista entidades. Por defecto solo activas."""
    query = select(Entidad)
    
    # Filtro de estado
    if activo == "true":
        query = query.where(Entidad.activo == True)
    elif activo == "false":
        query = query.where(Entidad.activo == False)
    # Si es "all", no aplicamos filtro
    
    # Búsqueda
    if search:
        query = query.where(
            or_(
                Entidad.nombre.ilike(f"%{search}%"),
                Entidad.ruc.ilike(f"%{search}%")
            )
        )
    
    query = query.order_by(Entidad.nombre)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/centros-costo")
async def listar_centros_costo(
    entidad_id: str | None = None,
    activo: str = Query("true"),
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = select(CentroCosto)
    if entidad_id:
        query = query.where(CentroCosto.entidad_id == entidad_id)
    if activo == "true":
        query = query.where(CentroCosto.activo == True)
    elif activo == "false":
        query = query.where(CentroCosto.activo == False)
    query = query.order_by(CentroCosto.nombre)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/clasificadores")
async def listar_clasificadores(
    activo: str = Query("true"),
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = select(ClasificacionGasto)
    if activo == "true":
        query = query.where(ClasificacionGasto.activo == True)
    elif activo == "false":
        query = query.where(ClasificacionGasto.activo == False)
    query = query.order_by(ClasificacionGasto.codigo)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/entidades", response_model=EntidadOut)
async def crear_entidad(
    data: EntidadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    """Crear nueva entidad (Admin y Analista)"""
    # Verificar que el RUC no exista
    result = await db.execute(select(Entidad).where(Entidad.ruc == data.ruc))
    if result.scalar_one_or_none():
        raise HTTPException(400, f"Ya existe una entidad con RUC {data.ruc}")
    
    entidad = Entidad(id=uuid.uuid4(), **data.model_dump())
    db.add(entidad)
    await db.commit()
    await db.refresh(entidad)
    return entidad

@router.put("/entidades/{entidad_id}", response_model=EntidadOut)
async def actualizar_entidad(
    entidad_id: uuid.UUID,
    data: EntidadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    """Actualizar entidad (Admin y Analista)"""
    result = await db.execute(select(Entidad).where(Entidad.id == entidad_id))
    entidad = result.scalar_one_or_none()
    if not entidad:
        raise HTTPException(404, "Entidad no encontrada")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(entidad, key, value)
    
    await db.commit()
    await db.refresh(entidad)
    return entidad

@router.delete("/entidades/{entidad_id}")
async def eliminar_entidad(
    entidad_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))  # Solo Admin puede eliminar
):
    """Eliminar entidad (Solo Admin)"""
    result = await db.execute(select(Entidad).where(Entidad.id == entidad_id))
    entidad = result.scalar_one_or_none()
    if not entidad:
        raise HTTPException(404, "Entidad no encontrada")
    
    await db.delete(entidad)
    await db.commit()
    return {"message": "Entidad eliminada exitosamente"}

@router.get("/fuentes", response_model=list[FuenteDatosOut])
async def listar_fuentes(
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    """Lista todas las fuentes de datos disponibles"""
    result = await db.execute(
        select(FuenteDatos).where(FuenteDatos.activo == True).order_by(FuenteDatos.nombre)
    )
    return result.scalars().all()
    