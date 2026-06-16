from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.sistema import Usuario
from app.models.ciclo_gasto import (
    CertificacionPresupuestal, ModificacionPresupuestaria, Disponibilidad
)
from app.models.dimensionales import Entidad
from app.services.export_service import export_service
from datetime import datetime

router = APIRouter(prefix="/reportes", tags=["Reportes y Exportacion"])

# ==========================================
# EXPORTACIONES TABULARES (EXCEL/CSV)
# ==========================================

@router.get("/certificaciones/{formato}")
async def exportar_certificaciones(
    formato: str,  # "excel" o "csv"
    entidad_id: str | None = None,
    anio_fiscal: int | None = None,
    estado: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Exporta certificaciones a Excel o CSV"""
    if formato not in ("excel", "csv"):
        raise HTTPException(400, "Formato debe ser 'excel' o 'csv'")
    
    # Query
    query = (
        select(
            CertificacionPresupuestal,
            Entidad.nombre.label("entidad_nombre"),
        )
        .join(Entidad, CertificacionPresupuestal.entidad_id == Entidad.id)
    )
    
    if entidad_id:
        query = query.where(CertificacionPresupuestal.entidad_id == entidad_id)
    if anio_fiscal:
        query = query.where(CertificacionPresupuestal.anio_fiscal == anio_fiscal)
    if estado:
        query = query.where(CertificacionPresupuestal.estado == estado)
    
    result = await db.execute(query)
    rows = result.all()
    
    # Transformar datos
    data = []
    for row in rows:
        cert = row[0]
        data.append({
            "numero_certificado": cert.numero_certificado,
            "entidad_nombre": row[1],
            "fecha_certificacion": cert.fecha_certificacion.isoformat() if cert.fecha_certificacion else "",
            "anio_fiscal": cert.anio_fiscal,
            "monto_certificado": float(cert.monto_certificado or 0),
            "estado": cert.estado,
            "observaciones": cert.observaciones or "",
        })
    
    columns = {
        "numero_certificado": "N° Certificado",
        "entidad_nombre": "Entidad",
        "fecha_certificacion": "Fecha",
        "anio_fiscal": "Anio",
        "monto_certificado": "Monto (S/)",
        "estado": "Estado",
        "observaciones": "Observaciones",
    }
    
    # Generar archivo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if formato == "excel":
        output = export_service.to_excel(data, columns, "Certificaciones")
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="certificaciones_{timestamp}.xlsx"'}
        )
    else:
        output = export_service.to_csv(data, columns)
        return StreamingResponse(
            output,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="certificaciones_{timestamp}.csv"'}
        )


@router.get("/modificaciones/{formato}")
async def exportar_modificaciones(
    formato: str,
    entidad_id: str | None = None,
    anio: int | None = None,
    tipo: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Exporta modificaciones a Excel o CSV"""
    if formato not in ("excel", "csv"):
        raise HTTPException(400, "Formato invalido")
    
    query = (
        select(ModificacionPresupuestaria, Entidad.nombre.label("entidad_nombre"))
        .join(Entidad, ModificacionPresupuestaria.entidad_id == Entidad.id)
    )
    
    if entidad_id:
        query = query.where(ModificacionPresupuestaria.entidad_id == entidad_id)
    if anio:
        from sqlalchemy import extract
        query = query.where(extract('year', ModificacionPresupuestaria.fecha_aprobacion) == anio)
    if tipo:
        query = query.where(ModificacionPresupuestaria.tipo_modificacion == tipo)
    
    result = await db.execute(query)
    rows = result.all()
    
    data = []
    for row in rows:
        mod = row[0]
        data.append({
            "numero_resolucion": mod.numero_resolucion,
            "entidad_nombre": row[1],
            "tipo_modificacion": mod.tipo_modificacion,
            "fecha_aprobacion": mod.fecha_aprobacion.isoformat() if mod.fecha_aprobacion else "",
            "monto_total": float(mod.monto_total or 0),
            "estado": mod.estado,
            "descripcion": mod.descripcion or "",
        })
    
    columns = {
        "numero_resolucion": "N° Resolucion",
        "entidad_nombre": "Entidad",
        "tipo_modificacion": "Tipo",
        "fecha_aprobacion": "Fecha",
        "monto_total": "Monto (S/)",
        "estado": "Estado",
        "descripcion": "Descripcion",
    }
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if formato == "excel":
        output = export_service.to_excel(data, columns, "Modificaciones")
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="modificaciones_{timestamp}.xlsx"'}
        )
    else:
        output = export_service.to_csv(data, columns)
        return StreamingResponse(
            output,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="modificaciones_{timestamp}.csv"'}
        )


@router.get("/disponibilidades/{formato}")
async def exportar_disponibilidades(
    formato: str,
    entidad_id: str | None = None,
    estado: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Exporta disponibilidades a Excel o CSV"""
    if formato not in ("excel", "csv"):
        raise HTTPException(400, "Formato invalido")
    
    query = (
        select(Disponibilidad, Entidad.nombre.label("entidad_nombre"))
        .join(Entidad, Disponibilidad.entidad_id == Entidad.id)
    )
    
    if entidad_id:
        query = query.where(Disponibilidad.entidad_id == entidad_id)
    if estado:
        query = query.where(Disponibilidad.estado == estado)
    
    result = await db.execute(query)
    rows = result.all()
    
    data = []
    for row in rows:
        disp = row[0]
        data.append({
            "numero_solicitud": disp.numero_solicitud,
            "entidad_nombre": row[1],
            "fecha_solicitud": disp.fecha_solicitud.isoformat() if disp.fecha_solicitud else "",
            "monto_solicitado": float(disp.monto_solicitado or 0),
            "monto_aprobado": float(disp.monto_aprobado or 0),
            "estado": disp.estado,
            "observaciones": disp.observaciones or "",
        })
    
    columns = {
        "numero_solicitud": "N° Solicitud",
        "entidad_nombre": "Entidad",
        "fecha_solicitud": "Fecha",
        "monto_solicitado": "Solicitado (S/)",
        "monto_aprobado": "Aprobado (S/)",
        "estado": "Estado",
        "observaciones": "Observaciones",
    }
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if formato == "excel":
        output = export_service.to_excel(data, columns, "Disponibilidades")
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="disponibilidades_{timestamp}.xlsx"'}
        )
    else:
        output = export_service.to_csv(data, columns)
        return StreamingResponse(
            output,
            media_type="text/csv; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="disponibilidades_{timestamp}.csv"'}
        )


# ==========================================
# GENERACION DE PDFs (DOCUMENTOS OFICIALES)
# ==========================================

@router.get("/certificaciones/{cert_id}/pdf")
async def descargar_certificado_pdf(
    cert_id: str,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Genera y descarga el PDF del Certificado de Credito Presupuestario"""
    from uuid import UUID
    
    result = await db.execute(
        select(CertificacionPresupuestal).where(CertificacionPresupuestal.id == UUID(cert_id))
    )
    cert = result.scalar_one_or_none()
    if not cert:
        raise HTTPException(404, "Certificado no encontrado")
    
    # Obtener datos relacionados
    r_ent = await db.execute(select(Entidad).where(Entidad.id == cert.entidad_id))
    entidad = r_ent.scalar_one_or_none()
    
    r_disp = await db.execute(select(Disponibilidad).where(Disponibilidad.id == cert.disponibilidad_id))
    disp = r_disp.scalar_one_or_none()
    
    certificador_nombre = "Sistema"
    if cert.certificado_por:
        from app.models.sistema import Usuario as UserModel
        r_user = await db.execute(select(UserModel).where(UserModel.id == cert.certificado_por))
        user = r_user.scalar_one_or_none()
        if user:
            certificador_nombre = user.username
    
    certificado_data = {
        "numero_certificado": cert.numero_certificado,
        "entidad_nombre": entidad.nombre if entidad else "—",
        "fecha_certificacion": cert.fecha_certificacion.isoformat() if cert.fecha_certificacion else "",
        "anio_fiscal": cert.anio_fiscal,
        "estado": cert.estado,
        "disponibilidad_numero": disp.numero_solicitud if disp else "—",
        "disponibilidad_monto_aprobado": float(disp.monto_aprobado or 0) if disp else 0,
        "monto_certificado": float(cert.monto_certificado or 0),
        "observaciones": cert.observaciones or "",
        "certificador_nombre": certificador_nombre,
    }
    
    output = export_service.generate_certificado_pdf(certificado_data)
    
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="CCP_{cert.numero_certificado}.pdf"'
        }
    )


@router.get("/modificaciones/{mod_id}/pdf")
async def descargar_modificacion_pdf(
    mod_id: str,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Genera y descarga el PDF de la Resolucion de Modificacion"""
    from uuid import UUID
    
    result = await db.execute(
        select(ModificacionPresupuestaria).where(ModificacionPresupuestaria.id == UUID(mod_id))
    )
    mod = result.scalar_one_or_none()
    if not mod:
        raise HTTPException(404, "Modificacion no encontrada")
    
    r_ent = await db.execute(select(Entidad).where(Entidad.id == mod.entidad_id))
    entidad = r_ent.scalar_one_or_none()
    
    mod_data = {
        "numero_resolucion": mod.numero_resolucion,
        "entidad_nombre": entidad.nombre if entidad else "—",
        "fecha_aprobacion": mod.fecha_aprobacion.isoformat() if mod.fecha_aprobacion else "",
        "tipo_modificacion": mod.tipo_modificacion,
        "estado": mod.estado,
        "monto_total": float(mod.monto_total or 0),
        "descripcion": mod.descripcion or "",
    }
    
    output = export_service.generate_modificacion_pdf(mod_data)
    
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Resolucion_{mod.numero_resolucion}.pdf"'
        }
    )