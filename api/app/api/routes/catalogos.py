from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.permissions import require_role
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.sistema import Usuario
from app.models.dimensionales import Entidad, CentroCosto, ClasificacionGasto, FuenteDatos
from app.schemas.catalogo import EntidadOut, CentroCostoOut, ClasificadorOut
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/catalogos", tags=["Catálogos"])

@router.get("/entidades", response_model=list[EntidadOut])
async def listar_entidades(
    activo: bool = True,
    db: AsyncSession = Depends(get_db),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    result = await db.execute(
        select(Entidad).where(Entidad.activo == activo).order_by(Entidad.nombre)
    )
    return result.scalars().all()

@router.get("/centros-costo", response_model=list[CentroCostoOut])
async def listar_centros_costo(
    entidad_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = select(CentroCosto, Entidad.nombre.label("ent_nombre"))\
        .join(Entidad, CentroCosto.entidad_id == Entidad.id)\
        .where(CentroCosto.activo == True)
    
    if entidad_id:
        query = query.where(CentroCosto.entidad_id == entidad_id)
    
    query = query.order_by(CentroCosto.nombre)
    result = await db.execute(query)
    
    return [
        CentroCostoOut(
            id=row.CentroCosto.id,
            codigo=row.CentroCosto.codigo,
            nombre=row.CentroCosto.nombre,
            entidad_nombre=row.ent_nombre
        )
        for row in result.all()
    ]

@router.get("/clasificadores", response_model=list[ClasificadorOut])
async def listar_clasificadores(
    db: AsyncSession = Depends(get_db),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    result = await db.execute(
        select(ClasificacionGasto)
        .where(ClasificacionGasto.activo == True)
        .order_by(ClasificacionGasto.codigo)
    )
    return result.scalars().all()