from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
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
    current_user: Usuario = Depends(get_current_user)
):
    """
    Sube un archivo Excel/CSV y lo deja en cola para el Worker.
    El archivo se guarda temporalmente y el Worker lo procesará en background.
    """
    # Validar extensión
    if not file.filename.lower().endswith(('.csv', '.xlsx', '.xls')): # type: ignore
        raise HTTPException(400, "Solo se permiten archivos CSV o Excel")
    
    # Crear archivo temporal
    suffix = os.path.splitext(file.filename)[1] # type: ignore
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
            estado=EstadoCarga.pendiente,
            subido_por=current_user.id
        )
        db.add(carga)
        await db.commit()
        await db.refresh(carga)
        
        return UploadResponse(
            mensaje="Archivo recibido. El Worker lo procesará en segundos.",
            carga_id=carga.id,
            estado=carga.estado # type: ignore
        )
    except Exception as e:
        # Limpiar temp si falla
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(500, f"Error al procesar archivo: {str(e)}")

@router.get("/", response_model=list[CargaOut])
async def listar_cargas(
    estado: EstadoCarga | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: Usuario = Depends(get_current_user)
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
    _: Usuario = Depends(get_current_user)
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
    _: Usuario = Depends(get_current_user)
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
    _: Usuario = Depends(get_current_user)
):
    """
    SSE (Server-Sent Events) para mostrar barra de progreso en tiempo real.
    El Frontend se suscribe con EventSource.
    """
    async def event_generator():
        while True:
            # Nueva sesión por iteración (evita problemas con el pool)
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
                if carga.filas_total > 0:
                    progreso = int((carga.filas_ok / carga.filas_total) * 100)
                
                data = {
                    "carga_id": str(carga.id),
                    "estado": carga.estado,
                    "filas_total": carga.filas_total,
                    "filas_ok": carga.filas_ok,
                    "filas_error": carga.filas_error,
                    "progreso": progreso
                }
                
                yield f"data: {json.dumps(data)}\n\n"
                
                # Si terminó, cerrar stream
                if carga.estado in ["procesado", "error"]:
                    break
            
            await asyncio.sleep(1)  # Polling cada segundo
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Para Nginx
        }
    )