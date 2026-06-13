from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_, extract, case
from app.db.session import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_role
from app.models.sistema import Usuario
from app.models.seguimiento import AvanceFisico
from app.models.estrategicas import POI
from app.models.dimensionales import Entidad
from app.schemas.avance_fisico import (
    AvanceFisicoCreate, AvanceFisicoUpdate, AvanceFisicoOut, MESES_NOMBRES
)
import uuid
from typing import Literal

router = APIRouter(prefix="/avances", tags=["Metas Físicas"])


@router.post("/", response_model=AvanceFisicoOut)
async def registrar_avance(
    data: AvanceFisicoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    """Registra el avance físico mensual de una actividad del POI"""
    
    # 1. Verificar que el POI exista
    result_poi = await db.execute(select(POI).where(POI.id == data.poi_id))
    poi = result_poi.scalar_one_or_none()
    if not poi:
        raise HTTPException(404, "Actividad operativa (POI) no encontrada")
    
    # 2. Verificar unicidad (un avance por POI por mes/año)
    result_dup = await db.execute(
        select(AvanceFisico).where(
            AvanceFisico.poi_id == data.poi_id,
            AvanceFisico.mes == data.mes,
            AvanceFisico.anio == data.anio,
        )
    )
    if result_dup.scalar_one_or_none():
        raise HTTPException(
            400, 
            f"Ya existe un avance registrado para {MESES_NOMBRES[data.mes]} {data.anio} en esta actividad"
        )
    
    # 3. Crear el registro
    avance = AvanceFisico(
        id=uuid.uuid4(),
        registrado_por=current_user.id,
        **data.model_dump()
    )
    db.add(avance)
    await db.commit()
    await db.refresh(avance)
    return await _avance_con_joins(avance, db)


@router.get("/")
async def listar_avances(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    sort_by: str = Query("anio"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    entidad_id: str | None = None,
    poi_id: str | None = None,
    anio: int | None = None,
    mes: int | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = (
        select(
            AvanceFisico,
            Entidad.nombre.label("entidad_nombre"),
            POI.codigo_actividad.label("poi_codigo"),
            POI.nombre.label("poi_nombre"),
            POI.area_responsable.label("poi_area_responsable"),
        )
        .join(Entidad, AvanceFisico.entidad_id == Entidad.id)
        .join(POI, AvanceFisico.poi_id == POI.id)
    )
    count_query = select(func.count(AvanceFisico.id))
    
    # Filtros
    if entidad_id:
        query = query.where(AvanceFisico.entidad_id == entidad_id)
        count_query = count_query.where(AvanceFisico.entidad_id == entidad_id)
    if poi_id:
        query = query.where(AvanceFisico.poi_id == poi_id)
        count_query = count_query.where(AvanceFisico.poi_id == poi_id)
    if anio:
        query = query.where(AvanceFisico.anio == anio)
        count_query = count_query.where(AvanceFisico.anio == anio)
    if mes:
        query = query.where(AvanceFisico.mes == mes)
        count_query = count_query.where(AvanceFisico.mes == mes)
    
    # Búsqueda
    if search:
        search_filter = or_(
            POI.codigo_actividad.ilike(f"%{search}%"),
            POI.nombre.ilike(f"%{search}%"),
            Entidad.nombre.ilike(f"%{search}%"),
            AvanceFisico.observaciones.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = (
            count_query
            .join(Entidad, AvanceFisico.entidad_id == Entidad.id)
            .join(POI, AvanceFisico.poi_id == POI.id)
            .where(search_filter)
        )
    
    # Ordenamiento
    sort_col = getattr(AvanceFisico, sort_by, AvanceFisico.anio)
    order_fn = desc if sort_order == "desc" else asc
    
    # Ordenamiento especial por mes + año
    if sort_by == "anio":
        query = query.order_by(order_fn(AvanceFisico.anio), order_fn(AvanceFisico.mes))
    else:
        query = query.order_by(order_fn(sort_col))
    
    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    rows = result.all()
    
    data_out = []
    for row in rows:
        avance = row[0]
        avance_dict = AvanceFisicoOut.model_validate(avance).model_dump()
        avance_dict["entidad_nombre"] = row[1]
        avance_dict["poi_codigo"] = row[2]
        avance_dict["poi_nombre"] = row[3]
        avance_dict["poi_area_responsable"] = row[4]
        avance_dict["mes_nombre"] = MESES_NOMBRES.get(avance.mes, "")
        
        # Calcular porcentaje de avance
        if avance.meta_programada and float(avance.meta_programada) > 0:
            avance_dict["porcentaje_avance"] = round(
                float(avance.meta_ejecutada) / float(avance.meta_programada) * 100, 2
            )
        else:
            avance_dict["porcentaje_avance"] = 0.0
        
        data_out.append(avance_dict)
    
    return {
        "data": data_out,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": max(1, (total + limit - 1) // limit)
    }


@router.get("/{avance_id}", response_model=AvanceFisicoOut)
async def obtener_avance(
    avance_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    result = await db.execute(
        select(AvanceFisico).where(AvanceFisico.id == avance_id)
    )
    avance = result.scalar_one_or_none()
    if not avance:
        raise HTTPException(404, "Avance no encontrado")
    return await _avance_con_joins(avance, db)


@router.put("/{avance_id}", response_model=AvanceFisicoOut)
async def actualizar_avance(
    avance_id: uuid.UUID,
    data: AvanceFisicoUpdate,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista"))
):
    result = await db.execute(
        select(AvanceFisico).where(AvanceFisico.id == avance_id)
    )
    avance = result.scalar_one_or_none()
    if not avance:
        raise HTTPException(404, "Avance no encontrado")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(avance, key, value)
    
    await db.commit()
    await db.refresh(avance)
    return await _avance_con_joins(avance, db)


@router.delete("/{avance_id}")
async def eliminar_avance(
    avance_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador"))
):
    result = await db.execute(
        select(AvanceFisico).where(AvanceFisico.id == avance_id)
    )
    avance = result.scalar_one_or_none()
    if not avance:
        raise HTTPException(404, "Avance no encontrado")
    
    await db.delete(avance)
    await db.commit()
    return {"message": "Avance eliminado exitosamente"}


@router.get("/resumen/anual")
async def resumen_anual(
    entidad_id: str | None = None,
    anio: int = Query(...),
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Resumen de avance por mes para gráficos"""
    query = (
        select(
            AvanceFisico.mes,
            func.sum(AvanceFisico.meta_programada).label("total_programada"),
            func.sum(AvanceFisico.meta_ejecutada).label("total_ejecutada"),
            func.count(AvanceFisico.id).label("cantidad_avances"),
        )
        .where(AvanceFisico.anio == anio)
        .group_by(AvanceFisico.mes)
        .order_by(AvanceFisico.mes)
    )
    
    if entidad_id and entidad_id != "__all__" and entidad_id.strip():
        try:
            # Validar que sea un UUID válido antes de filtrar
            uuid.UUID(entidad_id)
            query = query.where(AvanceFisico.entidad_id == entidad_id)
        except ValueError:
            # Si no es un UUID válido, ignorar el filtro
            pass
    
    result = await db.execute(query)
    rows = result.all()
    
    resumen = []
    for row in rows:
        porcentaje = 0.0
        if row.total_programada and float(row.total_programada) > 0:
            porcentaje = round(float(row.total_ejecutada) / float(row.total_programada) * 100, 2)
        
        resumen.append({
            "mes": row.mes,
            "mes_nombre": MESES_NOMBRES.get(row.mes, ""),
            "total_programada": float(row.total_programada or 0),
            "total_ejecutada": float(row.total_ejecutada or 0),
            "porcentaje": porcentaje,
            "cantidad_avances": row.cantidad_avances,
        })
    
    return {"anio": anio, "data": resumen}


async def _avance_con_joins(avance: AvanceFisico, db: AsyncSession) -> AvanceFisicoOut:
    """Helper para enriquecer el avance con datos relacionados"""
    # Entidad
    r_ent = await db.execute(select(Entidad).where(Entidad.id == avance.entidad_id))
    entidad = r_ent.scalar_one_or_none()
    
    # POI
    r_poi = await db.execute(select(POI).where(POI.id == avance.poi_id))
    poi = r_poi.scalar_one_or_none()
    
    # Registrador
    registrador_nombre = None
    if avance.registrado_por:
        r_user = await db.execute(select(Usuario).where(Usuario.id == avance.registrado_por))
        user = r_user.scalar_one_or_none()
        registrador_nombre = user.username if user else None
    
    avance_dict = AvanceFisicoOut.model_validate(avance).model_dump()
    avance_dict["entidad_nombre"] = entidad.nombre if entidad else None
    avance_dict["poi_codigo"] = poi.codigo_actividad if poi else None
    avance_dict["poi_nombre"] = poi.nombre if poi else None
    avance_dict["poi_area_responsable"] = poi.area_responsable if poi else None
    avance_dict["mes_nombre"] = MESES_NOMBRES.get(avance.mes, "")
    avance_dict["registrador_nombre"] = registrador_nombre
    
    # Calcular porcentaje
    if avance.meta_programada and float(avance.meta_programada) > 0:
        avance_dict["porcentaje_avance"] = round(
            float(avance.meta_ejecutada) / float(avance.meta_programada) * 100, 2
        )
    else:
        avance_dict["porcentaje_avance"] = 0.0
    
    return AvanceFisicoOut(**avance_dict)