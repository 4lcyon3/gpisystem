from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.permissions import require_role
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.sistema import Usuario
from app.models.estrategicas import PEI, POI
from app.schemas.pei_poi import PEICreate, PEIUpdate, PEIOut, POICreate, POIUpdate, POIOut
import uuid

router = APIRouter(prefix="/planificacion", tags=["PEI y POI"])

# ============ PEI (Módulo 2) ============

@router.post("/pei", response_model=PEIOut)
async def crear_pei(
    data: PEICreate,
    db: AsyncSession = Depends(get_db),
    roles: list[str] = Depends(require_role("Administrador", "Analista"))
):
    pei = PEI(id=uuid.uuid4(), **data.model_dump())
    db.add(pei)
    await db.commit()
    await db.refresh(pei)
    return pei

@router.get("/pei", response_model=list[PEIOut])
async def listar_pei(
    entidad_id: str | None = None,
    estado: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = select(PEI).order_by(desc(PEI.creado_en))
    if entidad_id:
        query = query.where(PEI.entidad_id == entidad_id)
    if estado:
        query = query.where(PEI.estado == estado)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/pei/{pei_id}", response_model=PEIOut)
async def obtener_pei(
    pei_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    result = await db.execute(select(PEI).where(PEI.id == pei_id))
    pei = result.scalar_one_or_none()
    if not pei:
        raise HTTPException(404, "PEI no encontrado")
    return pei

@router.put("/pei/{pei_id}", response_model=PEIOut)
async def actualizar_pei(
    pei_id: uuid.UUID,
    data: PEIUpdate,
    db: AsyncSession = Depends(get_db),
    roles: list[str] = Depends(require_role("Administrador", "Analista"))
):
    result = await db.execute(select(PEI).where(PEI.id == pei_id))
    pei = result.scalar_one_or_none()
    if not pei:
        raise HTTPException(404, "PEI no encontrado")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(pei, key, value)
    
    await db.commit()
    await db.refresh(pei)
    return pei

# ============ POI (Módulo 3) ============

@router.post("/poi", response_model=POIOut)
async def crear_poi(
    data: POICreate,
    db: AsyncSession = Depends(get_db),
    roles: list[str] = Depends(require_role("Administrador", "Analista"))
):
    poi = POI(id=uuid.uuid4(), **data.model_dump())
    db.add(poi)
    await db.commit()
    await db.refresh(poi)
    return poi

@router.get("/poi", response_model=list[POIOut])
async def listar_poi(
    entidad_id: str | None = None,
    pei_id: str | None = None,
    estado: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = select(POI).order_by(desc(POI.creado_en))
    if entidad_id:
        query = query.where(POI.entidad_id == entidad_id)
    if pei_id:
        query = query.where(POI.pei_id == pei_id)
    if estado:
        query = query.where(POI.estado == estado)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/poi/{poi_id}", response_model=POIOut)
async def obtener_poi(
    poi_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    result = await db.execute(select(POI).where(POI.id == poi_id))
    poi = result.scalar_one_or_none()
    if not poi:
        raise HTTPException(404, "POI no encontrado")
    return poi

@router.put("/poi/{poi_id}", response_model=POIOut)
async def actualizar_poi(
    poi_id: uuid.UUID,
    data: POIUpdate,
    db: AsyncSession = Depends(get_db),
    roles: list[str] = Depends(require_role("Administrador", "Analista"))
):
    result = await db.execute(select(POI).where(POI.id == poi_id))
    poi = result.scalar_one_or_none()
    if not poi:
        raise HTTPException(404, "POI no encontrado")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(poi, key, value)
    
    await db.commit()
    await db.refresh(poi)
    return poi