from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import date
from decimal import Decimal

class DisponibilidadCreate(BaseModel):
    entidad_id: UUID
    numero_solicitud: str
    poi_id: UUID
    meta_id: UUID | None = None
    clasificacion_id: UUID
    fuente_id: UUID
    monto_solicitado: Decimal
    monto_aprobado: Decimal = Decimal("0.00")
    estado: str = "pendiente"
    fecha_solicitud: date

class DisponibilidadOut(BaseModel):
    id: UUID
    numero_solicitud: str
    monto_solicitado: Decimal
    monto_aprobado: Decimal
    estado: str
    fecha_solicitud: date
    
    model_config = ConfigDict(from_attributes=True)

class CertificacionCreate(BaseModel):
    numero_certificacion: str
    disponibilidad_id: UUID | None = None
    monto_certificado: Decimal
    fecha_certificacion: date
    estado: str = "vigente"

class CertificacionOut(BaseModel):
    id: UUID
    numero_certificacion: str
    monto_certificado: Decimal
    fecha_certificacion: date
    estado: str
    
    model_config = ConfigDict(from_attributes=True)

class ModificacionPresupuestariaCreate(BaseModel):
    entidad_id: UUID
    numero_resolucion: str
    tipo_modificacion: str
    fecha_aprobacion: date
    monto_total: Decimal
    estado: str = "aprobada"

class ModificacionPresupuestariaOut(BaseModel):
    id: UUID
    numero_resolucion: str
    tipo_modificacion: str
    monto_total: Decimal
    fecha_aprobacion: date
    estado: str
    
    model_config = ConfigDict(from_attributes=True)

class AvanceFisicoCreate(BaseModel):
    poi_id: UUID
    anio_fiscal: int
    mes: int
    meta_programada: Decimal
    avance_ejecutado: Decimal
    porcentaje_avance: Decimal
    evidencia: str | None = None

class AvanceFisicoOut(BaseModel):
    id: UUID
    poi_id: UUID
    anio_fiscal: int
    mes: int
    meta_programada: Decimal
    avance_ejecutado: Decimal
    porcentaje_avance: Decimal
    
    model_config = ConfigDict(from_attributes=True)