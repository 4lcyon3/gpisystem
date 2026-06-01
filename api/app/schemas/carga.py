from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from enum import Enum

class EstadoCarga(str, Enum):
    pendiente = "pendiente"
    procesando = "procesando"
    procesado = "procesado"
    error = "error"

class CargaBase(BaseModel):
    nombre_archivo: str
    tipo_archivo: str
    tamanio_bytes: int
    estado: EstadoCarga
    filas_total: int = 0
    filas_ok: int = 0
    filas_error: int = 0

class CargaOut(CargaBase):
    id: UUID
    creado_en: datetime
    procesado_en: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)

class CargaDetalleOut(BaseModel):
    numero_fila: int
    estado: str
    mensaje_error: str | None = None
    
    model_config = ConfigDict(from_attributes=True)

class UploadResponse(BaseModel):
    mensaje: str
    carga_id: UUID
    estado: EstadoCarga