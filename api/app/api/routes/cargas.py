from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.permissions import get_user_roles, require_role
from app.db.session import get_db
from app.models.sistema import CargaDatos, CargaDetalle
from app.schemas.carga import CargaOut, CargaDetalleOut, UploadResponse, EstadoCarga
from app.core.auth import get_current_user
from app.models.sistema import Usuario
import uuid
import os
import tempfile
import json
import asyncio

router = APIRouter(prefix="/cargas", tags=["Cargas Masivas"])

@router.post("/upload", response_model=UploadResponse)
async def upload_archivo(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista"))
):
    """
    Sube un archivo Excel/CSV y lo deja en cola para el Worker.
    """
    
    # Validar extensión
    if not file.filename or not file.filename.lower().endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(400, "Solo se permiten archivos CSV o Excel")
    
    # Crear archivo temporal
    suffix = os.path.splitext(file.filename)[1]
    temp_fd, temp_path = tempfile.mkstemp(suffix=suffix)
    
    try:
        # Guardar contenido en el temp
        with os.fdopen(temp_fd, 'wb') as f:
            content = await file.read()
            f.write(content)
        
        # Crear registro en BD
        carga = CargaDatos(
            id=uuid.uuid4(),
            nombre_archivo=temp_path,  # El Worker usará esta ruta
            tipo_archivo=suffix[1:],
            tamanio_bytes=len(content),
            estado=EstadoCarga.pendiente,  # Usar string directo para evitar problemas con Enums
            subido_por=current_user.id  # ✅ Ahora sí funciona
        )
        db.add(carga)
        await db.commit()
        await db.refresh(carga)
        
        return UploadResponse(
            mensaje="Archivo recibido. El Worker lo procesará en segundos.",
            carga_id=carga.id,
            estado=carga.estado, # type: ignore
        )
    except Exception as e:
        # Limpiar temp si falla
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass
        raise HTTPException(500, f"Error al procesar archivo: {str(e)}")

@router.get("/", response_model=list[CargaOut])
async def listar_cargas(
    estado: EstadoCarga | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    """Historial de cargas masivas (Módulo 13 adaptado)"""
    query = select(CargaDatos).order_by(desc(CargaDatos.creado_en))
    
    if estado:
        query = query.where(CargaDatos.estado == estado)
    
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{carga_id}", response_model=CargaOut)
async def detalle_carga(
    carga_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    result = await db.execute(
        select(CargaDatos).where(CargaDatos.id == carga_id)
    )
    carga = result.scalar_one_or_none()
    if not carga:
        raise HTTPException(404, "Carga no encontrada")
    return carga

@router.get("/{carga_id}/errores", response_model=list[CargaDetalleOut])
async def ver_errores_carga(
    carga_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    """Filas que fallaron durante el procesamiento"""
    result = await db.execute(
        select(CargaDetalle)
        .where(CargaDetalle.carga_id == carga_id, CargaDetalle.estado == "error")
        .order_by(CargaDetalle.numero_fila)
    )
    return result.scalars().all()

@router.get("/{carga_id}/stream")
async def stream_progreso(
    carga_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    """SSE para progreso en tiempo real. Se cierra automáticamente al terminar."""
    async def event_generator():
        max_iterations = 3600  # Máximo 1 hora (3600 segundos)
        iterations = 0
        
        while iterations < max_iterations:
            iterations += 1
            
            # Nueva sesión por iteración
            from app.db.session import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(CargaDatos).where(CargaDatos.id == carga_id)
                )
                carga = result.scalar_one_or_none()
                
                if not carga:
                    yield f"data: {json.dumps({'error': 'Carga no encontrada'})}\n\n"
                    break
                
                progreso = 0
                if carga.filas_total and carga.filas_total > 0:
                    progreso = int((carga.filas_ok / carga.filas_total) * 100)
                
                data = {
                    "carga_id": str(carga.id),
                    "estado": carga.estado,
                    "filas_total": carga.filas_total or 0,
                    "filas_ok": carga.filas_ok or 0,
                    "filas_error": carga.filas_error or 0,
                    "progreso": progreso
                }
                
                yield f"data: {json.dumps(data)}\n\n"
                
                # ✅ CERRAR la conexión cuando termina
                if carga.estado in ["procesado", "error"]:
                    print(f"[SSE] Carga {carga_id} terminó con estado: {carga.estado}. Cerrando stream.")
                    break
            
            await asyncio.sleep(1)
        
        if iterations >= max_iterations:
            print(f"[SSE] Timeout alcanzado para carga {carga_id}")
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
@router.get("/{carga_id}/errores-detallados")
async def ver_errores_detallados(
    carga_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user)
):
    """Ver errores detallados con datos de cada fila"""
    result = await db.execute(
        select(CargaDetalle)
        .where(CargaDetalle.carga_id == carga_id)
        .order_by(CargaDetalle.numero_fila)
        .limit(100)
    )
    errores = result.scalars().all()
    
    return {
        "total_errores": len(errores),
        "errores": [
            {
                "fila": e.numero_fila,
                "estado": e.estado,
                "mensaje": e.mensaje_error,
                "datos_raw": e.datos_raw
            }
            for e in errores
        ]
    }