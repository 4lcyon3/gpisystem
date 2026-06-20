from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_
from app.db.session import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_role
from app.models.sistema import Usuario
from app.models.ciclo_gasto import ProgramacionMultianual, ProgramacionDetalle
from app.models.dimensionales import Entidad
from app.schemas.programacion import (
    ProgramacionCreate, ProgramacionDetalleOut, ProgramacionUpdate, ProgramacionOut
)
import uuid
from typing import Literal

router = APIRouter(prefix="/programacion", tags=["Programación Multianual"])


@router.post("/", response_model=ProgramacionOut)
async def crear_programacion(
    data: ProgramacionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    """Crea una nueva programación multianual con sus detalles anuales"""
    
    # Verificar entidad
    result_ent = await db.execute(select(Entidad).where(Entidad.id == data.entidad_id))
    if not result_ent.scalar_one_or_none():
        raise HTTPException(400, "La entidad seleccionada no existe")
    
    # Crear programación (cabecera)
    programacion = ProgramacionMultianual(
        id=uuid.uuid4(),
        entidad_id=data.entidad_id,
        nombre=data.nombre,
        tipo=data.tipo,
        anio_inicio=data.anio_inicio,
        anio_fin=data.anio_fin,
        estado=data.estado,
        observaciones=data.observaciones,
    )
    db.add(programacion)
    await db.flush()  # Para obtener el ID antes de crear detalles
    
    # Crear detalles anuales
    for detalle_data in data.detalles:
        # Validar que el año del detalle esté en el rango
        if detalle_data.anio_fiscal < data.anio_inicio or detalle_data.anio_fiscal > data.anio_fin:
            await db.rollback()
            raise HTTPException(
                400,
                f"El año {detalle_data.anio_fiscal} está fuera del rango ({data.anio_inicio}-{data.anio_fin})"
            )
        
        detalle = ProgramacionDetalle(
            id=uuid.uuid4(),
            programacion_id=programacion.id,
            anio_fiscal=detalle_data.anio_fiscal,
            monto_programado=detalle_data.monto_programado,
            meta_fisica=detalle_data.meta_fisica,
            unidad_medida=detalle_data.unidad_medida,
        )
        db.add(detalle)
    
    await db.commit()
    await db.refresh(programacion)
    return await _programacion_con_joins(programacion, db)


@router.get("/")
async def listar_programaciones(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    sort_by: str = Query("creado_en"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    entidad_id: str | None = None,
    estado: str | None = None,
    tipo: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    """Lista programaciones multianuales con JOINs"""
    query = (
        select(
            ProgramacionMultianual,
            Entidad.nombre.label("entidad_nombre"),
        )
        .join(Entidad, ProgramacionMultianual.entidad_id == Entidad.id)
    )
    count_query = select(func.count(ProgramacionMultianual.id))
    
    # Filtros
    if entidad_id:
        query = query.where(ProgramacionMultianual.entidad_id == entidad_id)
        count_query = count_query.where(ProgramacionMultianual.entidad_id == entidad_id)
    if estado:
        query = query.where(ProgramacionMultianual.estado == estado)
        count_query = count_query.where(ProgramacionMultianual.estado == estado)
    if tipo:
        query = query.where(ProgramacionMultianual.tipo == tipo)
        count_query = count_query.where(ProgramacionMultianual.tipo == tipo)
    
    # Búsqueda
    if search:
        search_filter = or_(
            ProgramacionMultianual.nombre.ilike(f"%{search}%"),
            ProgramacionMultianual.observaciones.ilike(f"%{search}%"),
            Entidad.nombre.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = (
            count_query
            .join(Entidad, ProgramacionMultianual.entidad_id == Entidad.id)
            .where(search_filter)
        )
    
    # Ordenamiento
    sort_col = getattr(ProgramacionMultianual, sort_by, ProgramacionMultianual.creado_en)
    order_fn = desc if sort_order == "desc" else asc
    query = query.order_by(order_fn(sort_col))
    
    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    rows = result.all()
    
    data_out = []
    for row in rows:
        prog = row[0]
        entidad_nombre = row[1]
        
        result_detalles = await db.execute(
            select(ProgramacionDetalle)
            .where(ProgramacionDetalle.programacion_id == prog.id)
            .order_by(ProgramacionDetalle.anio_fiscal)
        )
        detalles = result_detalles.scalars().all()
        
        prog_dict = {
            "id": prog.id,
            "entidad_id": prog.entidad_id,
            "nombre": prog.nombre,
            "tipo": prog.tipo,
            "anio_inicio": prog.anio_inicio,
            "anio_fin": prog.anio_fin,
            "estado": prog.estado,
            "observaciones": prog.observaciones,
            "creado_en": prog.creado_en,
            "actualizado_en": prog.actualizado_en,
            "entidad_nombre": entidad_nombre,
            "cantidad_anios": prog.anio_fin - prog.anio_inicio + 1,
            "detalles": [
                ProgramacionDetalleOut.model_validate(d).model_dump()
                for d in detalles
            ],
            "monto_total": float(
                sum(float(d.monto_programado or 0) for d in detalles)
            ),
        }
        data_out.append(prog_dict)
    
    return {
        "data": data_out,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": max(1, (total + limit - 1) // limit)
    }

@router.get("/{prog_id}", response_model=ProgramacionOut)
async def obtener_programacion(
    prog_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    result = await db.execute(
        select(ProgramacionMultianual).where(ProgramacionMultianual.id == prog_id)
    )
    prog = result.scalar_one_or_none()
    if not prog:
        raise HTTPException(404, "Programación no encontrada")
    return await _programacion_con_joins(prog, db)


@router.put("/{prog_id}", response_model=ProgramacionOut)
async def actualizar_programacion(
    prog_id: uuid.UUID,
    data: ProgramacionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    result = await db.execute(
        select(ProgramacionMultianual).where(ProgramacionMultianual.id == prog_id)
    )
    prog = result.scalar_one_or_none()
    if not prog:
        raise HTTPException(404, "Programación no encontrada")
    
    # Si está aprobada, solo se pueden cambiar observaciones
    if prog.estado == "aprobado" and data.estado != "archivado":
        if any(field is not None for field in [data.nombre, data.tipo, data.detalles]):
            raise HTTPException(
                400,
                "Solo se pueden modificar observaciones o archivar una programación aprobada"
            )
    
    # Actualizar campos base
    update_data = data.model_dump(exclude_unset=True, exclude={"detalles"})
    for key, value in update_data.items():
        setattr(prog, key, value)
    
    # Actualizar detalles si vienen
    if data.detalles is not None:
        # Eliminar detalles actuales
        result_detalles = await db.execute(
            select(ProgramacionDetalle).where(ProgramacionDetalle.programacion_id == prog_id)
        )
        for detalle in result_detalles.scalars().all():
            await db.delete(detalle)
        
        await db.flush()
        
        # Crear nuevos detalles
        for detalle_data in data.detalles:
            if detalle_data.anio_fiscal < prog.anio_inicio or detalle_data.anio_fiscal > prog.anio_fin:
                await db.rollback()
                raise HTTPException(
                    400,
                    f"El año {detalle_data.anio_fiscal} está fuera del rango ({prog.anio_inicio}-{prog.anio_fin})"
                )
            
            detalle = ProgramacionDetalle(
                id=uuid.uuid4(),
                programacion_id=prog.id,
                anio_fiscal=detalle_data.anio_fiscal,
                monto_programado=detalle_data.monto_programado,
                meta_fisica=detalle_data.meta_fisica,
                unidad_medida=detalle_data.unidad_medida,
            )
            db.add(detalle)
    
    await db.commit()
    await db.refresh(prog)
    return await _programacion_con_joins(prog, db)


@router.post("/{prog_id}/aprobar", response_model=ProgramacionOut)
async def aprobar_programacion(
    prog_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))  # Solo admin
):
    """Aprueba una programación (solo Admin)"""
    result = await db.execute(
        select(ProgramacionMultianual).where(ProgramacionMultianual.id == prog_id)
    )
    prog = result.scalar_one_or_none()
    if not prog:
        raise HTTPException(404, "Programación no encontrada")
    
    if prog.estado != "borrador":
        raise HTTPException(400, "Solo se pueden aprobar programaciones en borrador")
    
    # Validar que tenga al menos un detalle
    result_detalles = await db.execute(
        select(func.count(ProgramacionDetalle.id))
        .where(ProgramacionDetalle.programacion_id == prog_id)
    )
    if result_detalles.scalar() == 0:
        raise HTTPException(400, "La programación debe tener al menos un año programado")
    
    prog.estado = "aprobado"
    await db.commit()
    await db.refresh(prog)
    return await _programacion_con_joins(prog, db)


@router.delete("/{prog_id}")
async def eliminar_programacion(
    prog_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))
):
    result = await db.execute(
        select(ProgramacionMultianual).where(ProgramacionMultianual.id == prog_id)
    )
    prog = result.scalar_one_or_none()
    if not prog:
        raise HTTPException(404, "Programación no encontrada")
    
    if prog.estado == "aprobado":
        raise HTTPException(400, "No se puede eliminar una programación aprobada. Primero archívela.")
    
    # Los detalles se eliminan automáticamente por el CASCADE
    await db.delete(prog)
    await db.commit()
    return {"message": "Programación eliminada exitosamente"}

@router.post("/{prog_id}/archivar", response_model=ProgramacionOut)
async def archivar_programacion(
    prog_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))  # Solo admin
):
    """Archiva una programación aprobada (solo Admin)"""
    result = await db.execute(
        select(ProgramacionMultianual).where(ProgramacionMultianual.id == prog_id)
    )
    prog = result.scalar_one_or_none()
    if not prog:
        raise HTTPException(404, "Programación no encontrada")
    
    if prog.estado != "aprobado":
        raise HTTPException(400, "Solo se pueden archivar programaciones aprobadas")
    
    prog.estado = "archivado"
    await db.commit()
    await db.refresh(prog)
    return await _programacion_con_joins(prog, db)


async def _programacion_con_joins(
    prog: ProgramacionMultianual, db: AsyncSession
) -> ProgramacionOut:
    """Helper para enriquecer programación con JOINs y detalles"""
    
    r_ent = await db.execute(select(Entidad).where(Entidad.id == prog.entidad_id))
    entidad = r_ent.scalar_one_or_none()
    
    r_detalles = await db.execute(
        select(ProgramacionDetalle)
        .where(ProgramacionDetalle.programacion_id == prog.id)
        .order_by(ProgramacionDetalle.anio_fiscal)
    )
    detalles = r_detalles.scalars().all()
    
    prog_dict = {
        "id": prog.id,
        "entidad_id": prog.entidad_id,
        "nombre": prog.nombre,
        "tipo": prog.tipo,
        "anio_inicio": prog.anio_inicio,
        "anio_fin": prog.anio_fin,
        "estado": prog.estado,
        "observaciones": prog.observaciones,
        "creado_en": prog.creado_en,
        "actualizado_en": prog.actualizado_en,
        # Campos enriquecidos
        "entidad_nombre": entidad.nombre if entidad else None,
        "cantidad_anios": prog.anio_fin - prog.anio_inicio + 1,
        "detalles": [
            ProgramacionDetalleOut.model_validate(d).model_dump()
            for d in detalles
        ],
        "monto_total": float(
            sum(float(d.monto_programado or 0) for d in detalles)
        ),
    }
    
    # 4. Validar con Pydantic usando el diccionario (no el objeto ORM)
    return ProgramacionOut.model_validate(prog_dict)

@router.post("/{prog_id}/restaurar", response_model=ProgramacionOut)
async def restaurar_programacion(
    prog_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))
):
    """Restaura una programación archivada a estado aprobado (solo Admin)"""
    result = await db.execute(
        select(ProgramacionMultianual).where(ProgramacionMultianual.id == prog_id)
    )
    prog = result.scalar_one_or_none()
    if not prog:
        raise HTTPException(404, "Programación no encontrada")
    
    if prog.estado != "archivado":
        raise HTTPException(400, "Solo se pueden restaurar programaciones archivadas")
    
    prog.estado = "aprobado"
    await db.commit()
    await db.refresh(prog)
    return await _programacion_con_joins(prog, db)

@router.get("/sugerencia/{entidad_id}/{anio_fiscal}")
async def obtener_sugerencia_pia(
    entidad_id: uuid.UUID,
    anio_fiscal: int,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """
    Obtiene las programaciones aprobadas/vigentes para un año fiscal específico.
    Sirve como sugerencia para la formulación del PIA.
    """
    # Buscar programaciones aprobadas que incluyan el año fiscal consultado
    query = (
        select(
            ProgramacionMultianual,
            ProgramacionDetalle.monto_programado,
            ProgramacionDetalle.meta_fisica,
        )
        .join(ProgramacionDetalle, ProgramacionMultianual.id == ProgramacionDetalle.programacion_id)
        .where(
            ProgramacionMultianual.entidad_id == entidad_id,
            ProgramacionMultianual.estado == "aprobado",
            ProgramacionMultianual.anio_inicio <= anio_fiscal,
            ProgramacionMultianual.anio_fin >= anio_fiscal,
            ProgramacionDetalle.anio_fiscal == anio_fiscal,
        )
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    sugerencias = []
    for row in rows:
        prog = row[0]
        sugerencias.append({
            "programacion_id": str(prog.id),
            "nombre": prog.nombre,
            "tipo": prog.tipo,
            "monto_sugerido": float(row[1] or 0),
            "meta_fisica_sugerida": float(row[2] or 0),
            "anio_fiscal": anio_fiscal,
        })
    
    # Calcular total sugerido
    total_sugerido = sum(s["monto_sugerido"] for s in sugerencias)
    
    return {
        "entidad_id": str(entidad_id),
        "anio_fiscal": anio_fiscal,
        "total_sugerido": total_sugerido,
        "cantidad_programas": len(sugerencias),
        "sugerencias": sugerencias,
    }

@router.get("/analitica/historico")
async def analitica_historico(
    entidad_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Dashboard analítico de programaciones multianuales"""
    # Resumen por estado
    query_estados = (
        select(
            ProgramacionMultianual.estado,
            func.count(ProgramacionMultianual.id).label("cantidad"),
        )
        .group_by(ProgramacionMultianual.estado)
    )
    
    if entidad_id:
        query_estados = query_estados.where(ProgramacionMultianual.entidad_id == entidad_id)
    
    result_estados = await db.execute(query_estados)
    por_estado = {row.estado: row.cantidad for row in result_estados.all()}
    
    # Resumen por tipo
    query_tipos = (
        select(
            ProgramacionMultianual.tipo,
            func.count(ProgramacionMultianual.id).label("cantidad"),
        )
        .group_by(ProgramacionMultianual.tipo)
    )
    
    if entidad_id:
        query_tipos = query_tipos.where(ProgramacionMultianual.entidad_id == entidad_id)
    
    result_tipos = await db.execute(query_tipos)
    por_tipo = {row.tipo: row.cantidad for row in result_tipos.all()}
    
    # Total programado histórico (solo aprobados/archivados)
    query_montos = (
        select(
            func.sum(ProgramacionDetalle.monto_programado).label("total"),
        )
        .join(ProgramacionMultianual, ProgramacionDetalle.programacion_id == ProgramacionMultianual.id)
        .where(ProgramacionMultianual.estado.in_(["aprobado", "archivado"]))
    )
    
    if entidad_id:
        query_montos = query_montos.where(ProgramacionMultianual.entidad_id == entidad_id)
    
    result_montos = await db.execute(query_montos)
    total_historico = float(result_montos.scalar() or 0)
    
    # Evolución por año de inicio
    query_evolucion = (
        select(
            ProgramacionMultianual.anio_inicio,
            func.count(ProgramacionMultianual.id).label("cantidad"),
            func.sum(
                select(func.sum(ProgramacionDetalle.monto_programado))
                .where(ProgramacionDetalle.programacion_id == ProgramacionMultianual.id)
                .correlate(ProgramacionMultianual)
                .scalar_subquery()
            ).label("monto_total"),
        )
        .where(ProgramacionMultianual.estado.in_(["aprobado", "archivado"]))
        .group_by(ProgramacionMultianual.anio_inicio)
        .order_by(ProgramacionMultianual.anio_inicio)
    )
    
    if entidad_id:
        query_evolucion = query_evolucion.where(ProgramacionMultianual.entidad_id == entidad_id)
    
    result_evolucion = await db.execute(query_evolucion)
    evolucion = [
        {
            "anio": row.anio_inicio,
            "cantidad": row.cantidad,
            "monto_total": float(row.monto_total or 0),
        }
        for row in result_evolucion.all()
    ]
    
    return {
        "total_programaciones": sum(por_estado.values()),
        "por_estado": por_estado,
        "por_tipo": por_tipo,
        "total_historico_programado": total_historico,
        "evolucion_anual": evolucion,
    }