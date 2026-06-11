from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_
from app.db.session import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_role
from app.models.sistema import Usuario
from app.models.estrategicas import Presupuesto, POI
from app.models.dimensionales import Entidad, CentroCosto, ClasificacionGasto, FuenteDatos
from app.schemas.presupuesto import (
    PresupuestoCreate, PresupuestoUpdate, PresupuestoOut,
    ProgramacionMultianualCreate, ProgramacionMultianualOut
)
from app.models.ciclo_gasto import ProgramacionMultianual
import uuid
from typing import Literal

router = APIRouter(prefix="/presupuesto", tags=["Presupuesto"])

# ============ Programación Multianual (Módulo 4) ============
@router.post("/programacion", response_model=ProgramacionMultianualOut)
async def crear_programacion(
    data: ProgramacionMultianualCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
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
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = select(ProgramacionMultianual).order_by(desc(ProgramacionMultianual.creado_en))
    if entidad_id:
        query = query.where(ProgramacionMultianual.entidad_id == entidad_id)
    if anio:
        query = query.where(ProgramacionMultianual.anio_programacion == anio)
    result = await db.execute(query)
    return result.scalars().all()

# ============ Presupuesto con Paginación ============
@router.post("/", response_model=PresupuestoOut)
async def crear_presupuesto(
    data: PresupuestoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    presupuesto = Presupuesto(id=uuid.uuid4(), **data.model_dump())
    db.add(presupuesto)
    await db.commit()
    await db.refresh(presupuesto)
    return presupuesto

@router.get("/")
async def listar_presupuestos(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    sort_by: str = Query("creado_en"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    entidad_id: str | None = None,
    anio_fiscal: int | None = None,
    centro_costo_id: str | None = None,
    poi_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    # Query con JOINs para traer nombres relacionados
    query = (
        select(
            Presupuesto,
            Entidad.nombre.label("entidad_nombre"),
            CentroCosto.nombre.label("centro_costo_nombre"),
            ClasificacionGasto.codigo.label("clasificador_codigo"),
            ClasificacionGasto.descripcion.label("clasificador_descripcion"),
            POI.nombre.label("poi_nombre"),
            FuenteDatos.nombre.label("fuente_datos_nombre")
        )
        .join(Entidad, Presupuesto.entidad_id == Entidad.id)
        .join(CentroCosto, Presupuesto.centro_costo_id == CentroCosto.id)
        .join(ClasificacionGasto, Presupuesto.clasificacion_gasto_id == ClasificacionGasto.id)
        .join(FuenteDatos, Presupuesto.fuente_datos_id == FuenteDatos.id)
        .outerjoin(POI, Presupuesto.poi_id == POI.id)
    )
    count_query = select(func.count(Presupuesto.id))

    # Filtros
    if entidad_id:
        query = query.where(Presupuesto.entidad_id == entidad_id)
        count_query = count_query.where(Presupuesto.entidad_id == entidad_id)
    if anio_fiscal:
        query = query.where(Presupuesto.anio_fiscal == anio_fiscal)
        count_query = count_query.where(Presupuesto.anio_fiscal == anio_fiscal)
    if centro_costo_id:
        query = query.where(Presupuesto.centro_costo_id == centro_costo_id)
        count_query = count_query.where(Presupuesto.centro_costo_id == centro_costo_id)
    if poi_id:
        query = query.where(Presupuesto.poi_id == poi_id)
        count_query = count_query.where(Presupuesto.poi_id == poi_id)

    # Búsqueda multi-campo
    if search:
        search_filter = or_(
            Entidad.nombre.ilike(f"%{search}%"),
            CentroCosto.nombre.ilike(f"%{search}%"),
            ClasificacionGasto.codigo.ilike(f"%{search}%"),
            ClasificacionGasto.descripcion.ilike(f"%{search}%"),
            POI.nombre.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.join(Entidad, Presupuesto.entidad_id == Entidad.id) \
                                 .join(CentroCosto, Presupuesto.centro_costo_id == CentroCosto.id) \
                                 .join(ClasificacionGasto, Presupuesto.clasificacion_gasto_id == ClasificacionGasto.id) \
                                 .outerjoin(POI, Presupuesto.poi_id == POI.id) \
                                 .where(search_filter)

    # Ordenamiento
    sort_col = getattr(Presupuesto, sort_by, Presupuesto.creado_en)
    order_fn = desc if sort_order == "desc" else asc
    query = query.order_by(order_fn(sort_col))

    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    rows = result.all()

    data_out = []
    for row in rows:
        p = row[0]
        p_dict = PresupuestoOut.model_validate(p).model_dump()
        p_dict["entidad_nombre"] = row[1]
        p_dict["centro_costo_nombre"] = row[2]
        p_dict["clasificador_codigo"] = row[3]
        p_dict["clasificador_descripcion"] = row[4]
        p_dict["poi_nombre"] = row[5]
        p_dict["fuente_datos_nombre"] = row[6]
        # Calcular PIM = PIA + modificaciones
        pia_val = float(p.pia or 0)
        mod_val = float(p.modificaciones_acumuladas or 0)
        p_dict["pim"] = pia_val + mod_val
        data_out.append(p_dict)

    return {
        "data": data_out,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": max(1, (total + limit - 1) // limit)
    }

@router.get("/{presupuesto_id}", response_model=PresupuestoOut)
async def obtener_presupuesto(
    presupuesto_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
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
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
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

@router.delete("/{presupuesto_id}")
async def eliminar_presupuesto(
    presupuesto_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    result = await db.execute(select(Presupuesto).where(Presupuesto.id == presupuesto_id))
    presupuesto = result.scalar_one_or_none()
    if not presupuesto:
        raise HTTPException(404, "Presupuesto no encontrado")
    await db.delete(presupuesto)
    await db.commit()
    return {"message": "Presupuesto eliminado exitosamente"}