from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_
from app.db.session import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_role
from app.models.sistema import Usuario
from app.models.ciclo_gasto import Disponibilidad
from app.models.dimensionales import Entidad, CentroCosto, ClasificacionGasto
from app.models.estrategicas import POI
from app.schemas.disponibilidad import (
    DisponibilidadCreate, DisponibilidadUpdate, DisponibilidadOut,
    DisponibilidadAprobar, DisponibilidadRechazar
)
from app.models.catalogos import FuenteFinanciamiento
import uuid
from datetime import datetime
from typing import Literal

router = APIRouter(prefix="/disponibilidad", tags=["Disponibilidad Presupuestal"])


@router.post("/", response_model=DisponibilidadOut)
async def crear_disponibilidad(
    data: DisponibilidadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    # Verificar que el número de solicitud sea único
    result_sol = await db.execute(
        select(Disponibilidad).where(Disponibilidad.numero_solicitud == data.numero_solicitud)
    )
    if result_sol.scalar_one_or_none():
        raise HTTPException(400, f"Ya existe una solicitud con el número {data.numero_solicitud}")

    disponibilidad = Disponibilidad(id=uuid.uuid4(), estado="pendiente", **data.model_dump())
    db.add(disponibilidad)
    await db.commit()
    await db.refresh(disponibilidad)
    return await _disponibilidad_con_joins(disponibilidad, db)


@router.get("/")
async def listar_disponibilidades(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    sort_by: str = Query("fecha_solicitud"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    entidad_id: str | None = None,
    estado: str | None = None,
    anio_fiscal: int | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = (
        select(
            Disponibilidad,
            Entidad.nombre.label("entidad_nombre"),
            CentroCosto.nombre.label("centro_costo_nombre"),
            POI.nombre.label("poi_nombre"),
            ClasificacionGasto.codigo.label("clasificador_codigo"),
            ClasificacionGasto.descripcion.label("clasificador_descripcion"),
            FuenteFinanciamiento.nombre.label("fuente_nombre"),
        )
        .join(Entidad, Disponibilidad.entidad_id == Entidad.id)
        .join(CentroCosto, Disponibilidad.centro_costo_id == CentroCosto.id)
        .join(POI, Disponibilidad.poi_id == POI.id)
        .join(ClasificacionGasto, Disponibilidad.clasificacion_id == ClasificacionGasto.id)
        .join(FuenteFinanciamiento, Disponibilidad.fuente_id == FuenteFinanciamiento.id)
    )
    count_query = select(func.count(Disponibilidad.id))

    # Filtros
    if entidad_id:
        query = query.where(Disponibilidad.entidad_id == entidad_id)
        count_query = count_query.where(Disponibilidad.entidad_id == entidad_id)
    if estado:
        query = query.where(Disponibilidad.estado == estado)
        count_query = count_query.where(Disponibilidad.estado == estado)
    if anio_fiscal:
        query = query.where(Disponibilidad.anio_fiscal == anio_fiscal)
        count_query = count_query.where(Disponibilidad.anio_fiscal == anio_fiscal)

    # Búsqueda
    if search:
        search_filter = or_(
            Disponibilidad.numero_solicitud.ilike(f"%{search}%"),
            Disponibilidad.descripcion.ilike(f"%{search}%"),
            Entidad.nombre.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = (
            count_query
            .join(Entidad, Disponibilidad.entidad_id == Entidad.id)
            .where(search_filter)
        )

    # Ordenamiento
    sort_col = getattr(Disponibilidad, sort_by, Disponibilidad.fecha_solicitud)
    order_fn = desc if sort_order == "desc" else asc
    query = query.order_by(order_fn(sort_col))

    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    rows = result.all()

    data_out = []
    for row in rows:
        disp = row[0]
        disp_dict = DisponibilidadOut.model_validate(disp).model_dump()
        disp_dict["entidad_nombre"] = row[1]
        disp_dict["centro_costo_nombre"] = row[2]
        disp_dict["poi_nombre"] = row[3]
        disp_dict["clasificador_codigo"] = row[4]
        disp_dict["clasificador_descripcion"] = row[5]
        disp_dict["fuente_nombre"] = row[6]
        data_out.append(disp_dict)

    return {
        "data": data_out,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": max(1, (total + limit - 1) // limit)
    }


@router.get("/{disp_id}", response_model=DisponibilidadOut)
async def obtener_disponibilidad(
    disp_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    result = await db.execute(select(Disponibilidad).where(Disponibilidad.id == disp_id))
    disp = result.scalar_one_or_none()
    if not disp:
        raise HTTPException(404, "Solicitud de disponibilidad no encontrada")
    return await _disponibilidad_con_joins(disp, db)


@router.put("/{disp_id}", response_model=DisponibilidadOut)
async def actualizar_disponibilidad(
    disp_id: uuid.UUID,
    data: DisponibilidadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    result = await db.execute(select(Disponibilidad).where(Disponibilidad.id == disp_id))
    disp = result.scalar_one_or_none()
    if not disp:
        raise HTTPException(404, "Solicitud no encontrada")
    
    if disp.estado != "pendiente":
        raise HTTPException(400, "Solo se pueden editar solicitudes pendientes")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(disp, key, value)

    await db.commit()
    await db.refresh(disp)
    return await _disponibilidad_con_joins(disp, db)


@router.post("/{disp_id}/aprobar", response_model=DisponibilidadOut)
async def aprobar_disponibilidad(
    disp_id: uuid.UUID,
    data: DisponibilidadAprobar,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))  # Solo admin puede aprobar
):
    result = await db.execute(select(Disponibilidad).where(Disponibilidad.id == disp_id))
    disp = result.scalar_one_or_none()
    if not disp:
        raise HTTPException(404, "Solicitud no encontrada")
    
    if disp.estado != "pendiente":
        raise HTTPException(400, "Solo se pueden aprobar solicitudes pendientes")

    # Validar que el monto aprobado no exceda el solicitado
    if data.monto_aprobado > disp.monto_solicitado:
        raise HTTPException(400, "El monto aprobado no puede exceder el monto solicitado")

    disp.estado = "aprobado"
    disp.monto_aprobado = data.monto_aprobado # type: ignore
    disp.observaciones = data.observaciones
    disp.aprobado_por = current_user.id
    disp.fecha_aprobacion = datetime.now()

    await db.commit()
    await db.refresh(disp)
    return await _disponibilidad_con_joins(disp, db)


@router.post("/{disp_id}/rechazar", response_model=DisponibilidadOut)
async def rechazar_disponibilidad(
    disp_id: uuid.UUID,
    data: DisponibilidadRechazar,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))
):
    result = await db.execute(select(Disponibilidad).where(Disponibilidad.id == disp_id))
    disp = result.scalar_one_or_none()
    if not disp:
        raise HTTPException(404, "Solicitud no encontrada")
    
    if disp.estado != "pendiente":
        raise HTTPException(400, "Solo se pueden rechazar solicitudes pendientes")

    disp.estado = "rechazado"
    disp.monto_aprobado = 0
    disp.observaciones = data.observaciones
    disp.aprobado_por = current_user.id
    disp.fecha_aprobacion = datetime.now()

    await db.commit()
    await db.refresh(disp)
    return await _disponibilidad_con_joins(disp, db)


@router.delete("/{disp_id}")
async def eliminar_disponibilidad(
    disp_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))
):
    result = await db.execute(select(Disponibilidad).where(Disponibilidad.id == disp_id))
    disp = result.scalar_one_or_none()
    if not disp:
        raise HTTPException(404, "Solicitud no encontrada")
    
    if disp.estado != "pendiente":
        raise HTTPException(400, "Solo se pueden eliminar solicitudes pendientes")
    
    await db.delete(disp)
    await db.commit()
    return {"message": "Solicitud eliminada exitosamente"}


async def _disponibilidad_con_joins(disp: Disponibilidad, db: AsyncSession) -> DisponibilidadOut:
    """Helper para agregar nombres de entidades relacionadas"""
    result_ent = await db.execute(select(Entidad).where(Entidad.id == disp.entidad_id))
    entidad = result_ent.scalar_one_or_none()
    
    result_cc = await db.execute(select(CentroCosto).where(CentroCosto.id == disp.centro_costo_id))
    centro_costo = result_cc.scalar_one_or_none()
    
    result_poi = await db.execute(select(POI).where(POI.id == disp.poi_id))
    poi = result_poi.scalar_one_or_none()
    
    result_clas = await db.execute(select(ClasificacionGasto).where(ClasificacionGasto.id == disp.clasificacion_id))
    clasificador = result_clas.scalar_one_or_none()
    
    result_fuente = await db.execute(select(FuenteFinanciamiento).where(FuenteFinanciamiento.id == disp.fuente_id))
    fuente = result_fuente.scalar_one_or_none()
    
    disp_dict = DisponibilidadOut.model_validate(disp).model_dump()
    disp_dict["entidad_nombre"] = entidad.nombre if entidad else None
    disp_dict["centro_costo_nombre"] = centro_costo.nombre if centro_costo else None
    disp_dict["poi_nombre"] = poi.nombre if poi else None
    disp_dict["clasificador_codigo"] = clasificador.codigo if clasificador else None
    disp_dict["clasificador_descripcion"] = clasificador.descripcion if clasificador else None
    disp_dict["fuente_nombre"] = fuente.nombre if fuente else None
    
    return DisponibilidadOut(**disp_dict)