from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_
from app.db.session import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_role
from app.models.sistema import Usuario
from app.models.ciclo_gasto import ModificacionPresupuestaria
from app.models.dimensionales import Entidad
from app.schemas.modificacion import (
    ModificacionCreate, ModificacionUpdate, ModificacionOut
)
import uuid
from typing import Literal

router = APIRouter(prefix="/modificaciones", tags=["Modificaciones Presupuestarias"])


@router.post("/", response_model=ModificacionOut)
async def crear_modificacion(
    data: ModificacionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    # Verificar que la entidad exista
    result_ent = await db.execute(select(Entidad).where(Entidad.id == data.entidad_id))
    if not result_ent.scalar_one_or_none():
        raise HTTPException(400, "La entidad seleccionada no existe")

    # Verificar que el número de resolución sea único
    result_res = await db.execute(
        select(ModificacionPresupuestaria).where(
            ModificacionPresupuestaria.numero_resolucion == data.numero_resolucion
        )
    )
    if result_res.scalar_one_or_none():
        raise HTTPException(400, f"Ya existe una modificación con la resolución {data.numero_resolucion}")

    mod = ModificacionPresupuestaria(id=uuid.uuid4(), **data.model_dump())
    db.add(mod)
    await db.commit()
    await db.refresh(mod)
    return await _mod_con_entidad(mod, db)


@router.get("/")
async def listar_modificaciones(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    sort_by: str = Query("fecha_aprobacion"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    entidad_id: str | None = None,
    tipo_modificacion: str | None = None,
    estado: str | None = None,
    anio: int | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = (
        select(
            ModificacionPresupuestaria,
            Entidad.nombre.label("entidad_nombre"),
        )
        .join(Entidad, ModificacionPresupuestaria.entidad_id == Entidad.id)
    )
    count_query = select(func.count(ModificacionPresupuestaria.id))

    # Filtros
    if entidad_id:
        query = query.where(ModificacionPresupuestaria.entidad_id == entidad_id)
        count_query = count_query.where(ModificacionPresupuestaria.entidad_id == entidad_id)
    if tipo_modificacion:
        query = query.where(ModificacionPresupuestaria.tipo_modificacion == tipo_modificacion)
        count_query = count_query.where(ModificacionPresupuestaria.tipo_modificacion == tipo_modificacion)
    if estado:
        query = query.where(ModificacionPresupuestaria.estado == estado)
        count_query = count_query.where(ModificacionPresupuestaria.estado == estado)
    if anio:
        from sqlalchemy import extract
        query = query.where(extract('year', ModificacionPresupuestaria.fecha_aprobacion) == anio)
        count_query = count_query.where(extract('year', ModificacionPresupuestaria.fecha_aprobacion) == anio)

    # Búsqueda
    if search:
        search_filter = or_(
            ModificacionPresupuestaria.numero_resolucion.ilike(f"%{search}%"),
            ModificacionPresupuestaria.descripcion.ilike(f"%{search}%"),
            Entidad.nombre.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = (
            count_query
            .join(Entidad, ModificacionPresupuestaria.entidad_id == Entidad.id)
            .where(search_filter)
        )

    # Ordenamiento
    sort_col = getattr(ModificacionPresupuestaria, sort_by, ModificacionPresupuestaria.fecha_aprobacion)
    order_fn = desc if sort_order == "desc" else asc
    query = query.order_by(order_fn(sort_col))

    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    rows = result.all()

    data_out = []
    for row in rows:
        mod = row[0]
        mod_dict = ModificacionOut.model_validate(mod).model_dump()
        mod_dict["entidad_nombre"] = row[1]
        data_out.append(mod_dict)

    return {
        "data": data_out,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": max(1, (total + limit - 1) // limit)
    }


@router.get("/{mod_id}", response_model=ModificacionOut)
async def obtener_modificacion(
    mod_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    result = await db.execute(
        select(ModificacionPresupuestaria).where(ModificacionPresupuestaria.id == mod_id)
    )
    mod = result.scalar_one_or_none()
    if not mod:
        raise HTTPException(404, "Modificación no encontrada")
    return await _mod_con_entidad(mod, db)


@router.put("/{mod_id}", response_model=ModificacionOut)
async def actualizar_modificacion(
    mod_id: uuid.UUID,
    data: ModificacionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    result = await db.execute(
        select(ModificacionPresupuestaria).where(ModificacionPresupuestaria.id == mod_id)
    )
    mod = result.scalar_one_or_none()
    if not mod:
        raise HTTPException(404, "Modificación no encontrada")

    update_data = data.model_dump(exclude_unset=True)
    
    # Si cambia el número de resolución, verificar unicidad
    if "numero_resolucion" in update_data and update_data["numero_resolucion"] != mod.numero_resolucion:
        result_res = await db.execute(
            select(ModificacionPresupuestaria).where(
                ModificacionPresupuestaria.numero_resolucion == update_data["numero_resolucion"],
                ModificacionPresupuestaria.id != mod_id
            )
        )
        if result_res.scalar_one_or_none():
            raise HTTPException(400, f"Ya existe otra modificación con la resolución {update_data['numero_resolucion']}")

    for key, value in update_data.items():
        setattr(mod, key, value)

    await db.commit()
    await db.refresh(mod)
    return await _mod_con_entidad(mod, db)


@router.delete("/{mod_id}")
async def eliminar_modificacion(
    mod_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))  # Solo admin
):
    result = await db.execute(
        select(ModificacionPresupuestaria).where(ModificacionPresupuestaria.id == mod_id)
    )
    mod = result.scalar_one_or_none()
    if not mod:
        raise HTTPException(404, "Modificación no encontrada")
    await db.delete(mod)
    await db.commit()
    return {"message": "Modificación eliminada exitosamente"}


async def _mod_con_entidad(mod, db: AsyncSession) -> ModificacionOut:
    """Helper para agregar nombre de entidad"""
    result = await db.execute(select(Entidad).where(Entidad.id == mod.entidad_id))
    entidad = result.scalar_one_or_none()
    
    mod_dict = ModificacionOut.model_validate(mod).model_dump()
    mod_dict["entidad_nombre"] = entidad.nombre if entidad else None
    return ModificacionOut(**mod_dict)