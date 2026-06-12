from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_, extract
from app.db.session import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_role
from app.models.sistema import Usuario
from app.models.ciclo_gasto import CertificacionPresupuestal, Disponibilidad
from app.models.dimensionales import Entidad
from app.schemas.certificacion import (
    CertificacionCreate, CertificacionUpdate, CertificacionOut
)
import uuid
from datetime import datetime
from typing import Literal

router = APIRouter(prefix="/certificaciones", tags=["Certificación Presupuestal"])


@router.post("/", response_model=CertificacionOut)
async def crear_certificacion(
    data: CertificacionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))  # Solo admin certifica
):
    """Emite un Certificado de Crédito Presupuestario (CCP)"""
    
    # 1. Verificar unicidad del número
    result_num = await db.execute(
        select(CertificacionPresupuestal).where(
            CertificacionPresupuestal.numero_certificado == data.numero_certificado
        )
    )
    if result_num.scalar_one_or_none():
        raise HTTPException(400, f"Ya existe un certificado con número {data.numero_certificado}")
    
    # 2. Verificar que la disponibilidad exista y esté APROBADA
    result_disp = await db.execute(
        select(Disponibilidad).where(Disponibilidad.id == data.disponibilidad_id)
    )
    disponibilidad = result_disp.scalar_one_or_none()
    if not disponibilidad:
        raise HTTPException(404, "Disponibilidad no encontrada")
    if disponibilidad.estado != "aprobado":
        raise HTTPException(400, "Solo se pueden certificar disponibilidades APROBADAS")
    
    # 3. Validar que el monto certificado no exceda el aprobado
    if data.monto_certificado > disponibilidad.monto_aprobado:
        raise HTTPException(
            400, 
            f"El monto certificado ({data.monto_certificado}) no puede exceder el aprobado ({disponibilidad.monto_aprobado})"
        )
    
    # 4. Validar que la disponibilidad no esté ya certificada
    result_cert = await db.execute(
        select(func.count(CertificacionPresupuestal.id)).where(
            CertificacionPresupuestal.disponibilidad_id == data.disponibilidad_id,
            CertificacionPresupuestal.estado == "vigente"
        )
    )
    if result_cert.scalar() > 0: # type: ignore
        raise HTTPException(400, "Esta disponibilidad ya tiene un certificado vigente")
    
    # 5. Crear la certificación
    cert = CertificacionPresupuestal(
        id=uuid.uuid4(),
        certificado_por=current_user.id,
        **data.model_dump()
    )
    db.add(cert)
    await db.commit()
    await db.refresh(cert)
    return await _cert_con_joins(cert, db)


@router.get("/")
async def listar_certificaciones(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    sort_by: str = Query("fecha_certificacion"),
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
            CertificacionPresupuestal,
            Entidad.nombre.label("entidad_nombre"),
            Disponibilidad.numero_solicitud.label("disponibilidad_numero"),
            Disponibilidad.monto_aprobado.label("disponibilidad_monto_aprobado"),
        )
        .join(Entidad, CertificacionPresupuestal.entidad_id == Entidad.id)
        .join(Disponibilidad, CertificacionPresupuestal.disponibilidad_id == Disponibilidad.id)
    )
    count_query = select(func.count(CertificacionPresupuestal.id))
    
    if entidad_id:
        query = query.where(CertificacionPresupuestal.entidad_id == entidad_id)
        count_query = count_query.where(CertificacionPresupuestal.entidad_id == entidad_id)
    if estado:
        query = query.where(CertificacionPresupuestal.estado == estado)
        count_query = count_query.where(CertificacionPresupuestal.estado == estado)
    if anio_fiscal:
        query = query.where(CertificacionPresupuestal.anio_fiscal == anio_fiscal)
        count_query = count_query.where(CertificacionPresupuestal.anio_fiscal == anio_fiscal)
    if search:
        search_filter = or_(
            CertificacionPresupuestal.numero_certificado.ilike(f"%{search}%"),
            CertificacionPresupuestal.observaciones.ilike(f"%{search}%"),
            Entidad.nombre.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = (
            count_query
            .join(Entidad, CertificacionPresupuestal.entidad_id == Entidad.id)
            .where(search_filter)
        )
    
    sort_col = getattr(CertificacionPresupuestal, sort_by, CertificacionPresupuestal.fecha_certificacion)
    order_fn = desc if sort_order == "desc" else asc
    query = query.order_by(order_fn(sort_col))
    
    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    rows = result.all()
    
    data_out = []
    for row in rows:
        cert = row[0]
        cert_dict = CertificacionOut.model_validate(cert).model_dump()
        cert_dict["entidad_nombre"] = row[1]
        cert_dict["disponibilidad_numero"] = row[2]
        cert_dict["disponibilidad_monto_aprobado"] = float(row[3]) if row[3] else None
        data_out.append(cert_dict)
    
    return {
        "data": data_out,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": max(1, (total + limit - 1) // limit)
    }


@router.get("/{cert_id}", response_model=CertificacionOut)
async def obtener_certificacion(
    cert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    __: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    result = await db.execute(
        select(CertificacionPresupuestal).where(CertificacionPresupuestal.id == cert_id)
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(404, "Certificación no encontrada")
    return await _cert_con_joins(cert, db)


@router.put("/{cert_id}", response_model=CertificacionOut)
async def actualizar_certificacion(
    cert_id: uuid.UUID,
    data: CertificacionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))
):
    result = await db.execute(
        select(CertificacionPresupuestal).where(CertificacionPresupuestal.id == cert_id)
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(404, "Certificación no encontrada")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(cert, key, value)
    
    await db.commit()
    await db.refresh(cert)
    return await _cert_con_joins(cert, db)


@router.post("/{cert_id}/anular", response_model=CertificacionOut)
async def anular_certificacion(
    cert_id: uuid.UUID,
    observaciones: str,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))
):
    """Anula un certificado vigente, liberando el saldo congelado"""
    result = await db.execute(
        select(CertificacionPresupuestal).where(CertificacionPresupuestal.id == cert_id)
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(404, "Certificación no encontrada")
    if cert.estado != "vigente":
        raise HTTPException(400, "Solo se pueden anular certificados vigentes")
    
    cert.estado = "anulada"
    cert.observaciones = observaciones
    await db.commit()
    await db.refresh(cert)
    return await _cert_con_joins(cert, db)


@router.delete("/{cert_id}")
async def eliminar_certificacion(
    cert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))
):
    result = await db.execute(
        select(CertificacionPresupuestal).where(CertificacionPresupuestal.id == cert_id)
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(404, "Certificación no encontrada")
    if cert.estado != "vigente":
        raise HTTPException(400, "Solo se pueden eliminar certificados vigentes")
    
    await db.delete(cert)
    await db.commit()
    return {"message": "Certificación eliminada exitosamente"}


async def _cert_con_joins(cert: CertificacionPresupuestal, db: AsyncSession) -> CertificacionOut:
    """Helper para enriquecer la certificación con datos relacionados"""
    # Entidad
    r_ent = await db.execute(select(Entidad).where(Entidad.id == cert.entidad_id))
    entidad = r_ent.scalar_one_or_none()
    
    # Disponibilidad
    r_disp = await db.execute(select(Disponibilidad).where(Disponibilidad.id == cert.disponibilidad_id))
    disp = r_disp.scalar_one_or_none()
    
    # Certificador
    certificador_nombre = None
    if cert.certificado_por:
        r_user = await db.execute(select(Usuario).where(Usuario.id == cert.certificado_por))
        user = r_user.scalar_one_or_none()
        certificador_nombre = user.username if user else None
    
    cert_dict = CertificacionOut.model_validate(cert).model_dump()
    cert_dict["entidad_nombre"] = entidad.nombre if entidad else None
    cert_dict["disponibilidad_numero"] = disp.numero_solicitud if disp else None
    cert_dict["disponibilidad_monto_aprobado"] = float(disp.monto_aprobado) if disp and disp.monto_aprobado else None
    cert_dict["certificador_nombre"] = certificador_nombre
    return CertificacionOut(**cert_dict)