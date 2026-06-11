from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_
from app.db.session import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_role
from app.models.sistema import Usuario
from app.models.estrategicas import PEI, POI
from app.schemas.pei_poi import PEICreate, PEIUpdate, PEIOut, POICreate, POIOut, POIUpdate
import uuid
from typing import Literal

router = APIRouter(prefix="/planificacion", tags=["PEI y POI"])

# ============ PEI (Módulo 2) ============

@router.post("/pei", response_model=PEIOut)
async def crear_pei(
    data: PEICreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    pei = PEI(id=uuid.uuid4(), **data.model_dump())
    db.add(pei)
    await db.commit()
    await db.refresh(pei)
    return pei

@router.get("/pei")
async def listar_pei(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),  # ⚠️ Máximo 100, no 200
    search: str | None = None,
    sort_by: str = Query("creado_en"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    entidad_id: str | None = None,   # ← OPCIONAL (None por defecto)
    estado: str | None = None,       # ← OPCIONAL
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = select(PEI)
    count_query = select(func.count(PEI.id))
    
    if entidad_id:
        query = query.where(PEI.entidad_id == entidad_id)
        count_query = count_query.where(PEI.entidad_id == entidad_id)
    
    if estado:
        query = query.where(PEI.estado == estado)
        count_query = count_query.where(PEI.estado == estado)
    
    if search:
        search_filter = or_(
            PEI.codigo_objetivo.ilike(f"%{search}%"),
            PEI.descripcion.ilike(f"%{search}%"),
            PEI.area_responsable.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    sort_col = getattr(PEI, sort_by, PEI.creado_en)
    order_fn = desc if sort_order == "desc" else asc
    query = query.order_by(order_fn(sort_col))
    
    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    data = result.scalars().all()
    
    return {
        "data": [PEIOut.model_validate(item) for item in data],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": max(1, (total + limit - 1) // limit)
    }
@router.get("/pei/{pei_id}", response_model=PEIOut)
async def obtener_pei(
    pei_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
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
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
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

@router.delete("/pei/{pei_id}")
async def eliminar_pei(
    pei_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    result = await db.execute(select(PEI).where(PEI.id == pei_id))
    pei = result.scalar_one_or_none()
    if not pei:
        raise HTTPException(404, "PEI no encontrado")
    
    await db.delete(pei)
    await db.commit()
    return {"message": "PEI eliminado exitosamente"}

@router.post("/poi", response_model=POIOut)
async def crear_poi(
    data: POICreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    # Verificar que el PEI exista
    result_pei = await db.execute(select(PEI).where(PEI.id == data.pei_id))
    if not result_pei.scalar_one_or_none():
        raise HTTPException(400, "El PEI seleccionado no existe")
    
    poi = POI(id=uuid.uuid4(), **data.model_dump())
    db.add(poi)
    await db.commit()
    await db.refresh(poi)
    return poi

@router.get("/poi")
async def listar_poi(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    sort_by: str = Query("creado_en"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    entidad_id: str | None = None,
    pei_id: str | None = None,
    estado: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    from sqlalchemy import func, desc, asc, or_
    
    # Query con JOIN a PEI para traer código y descripción
    query = (
        select(
            POI,
            PEI.codigo_objetivo.label("pei_codigo"),
            PEI.descripcion.label("pei_descripcion")
        )
        .join(PEI, POI.pei_id == PEI.id)
    )
    count_query = select(func.count(POI.id))
    
    # Filtros
    if entidad_id:
        query = query.where(POI.entidad_id == entidad_id)
        count_query = count_query.where(POI.entidad_id == entidad_id)
    if pei_id:
        query = query.where(POI.pei_id == pei_id)
        count_query = count_query.where(POI.pei_id == pei_id)
    if estado:
        query = query.where(POI.estado == estado)
        count_query = count_query.where(POI.estado == estado)
    
    # Búsqueda
    if search:
        search_filter = or_(
            POI.codigo_actividad.ilike(f"%{search}%"),
            POI.nombre.ilike(f"%{search}%"),
            POI.area_responsable.ilike(f"%{search}%"),
            POI.responsable_directo.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # Ordenamiento
    sort_col = getattr(POI, sort_by, POI.creado_en)
    order_fn = desc if sort_order == "desc" else asc
    query = query.order_by(order_fn(sort_col))
    
    # Total
    total = (await db.execute(count_query)).scalar() or 0
    
    # Paginación
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    rows = result.all()
    
    # Construir respuesta con datos del PEI
    data_out = []
    for row in rows:
        poi = row[0]  # POI entity
        pei_codigo = row[1]
        pei_descripcion = row[2]
        
        poi_dict = POIOut.model_validate(poi).model_dump()
        poi_dict["pei_codigo"] = pei_codigo
        poi_dict["pei_descripcion"] = pei_descripcion
        data_out.append(poi_dict)
    
    return {
        "data": data_out,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": max(1, (total + limit - 1) // limit)
    }

@router.get("/poi/{poi_id}", response_model=POIOut)
async def obtener_poi(
    poi_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
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
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
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

@router.delete("/poi/{poi_id}")
async def eliminar_poi(
    poi_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    result = await db.execute(select(POI).where(POI.id == poi_id))
    poi = result.scalar_one_or_none()
    if not poi:
        raise HTTPException(404, "POI no encontrado")
    
    await db.delete(poi)
    await db.commit()
    return {"message": "POI eliminado exitosamente"}