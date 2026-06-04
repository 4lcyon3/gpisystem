from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import date
from decimal import Decimal

class PEIBase(BaseModel):
    codigo_objetivo: str
    descripcion: str
    accion_estrategica: str | None = None
    indicador: str | None = None
    linea_base: str | None = None
    meta_anual: str | None = None
    unidad_medida: str | None = None
    area_responsable: str | None = None
    vigencia_inicio: date
    vigencia_fin: date
    estado: str = "vigente"

class PEICreate(PEIBase):
    entidad_id: UUID

class PEIUpdate(BaseModel):
    descripcion: str | None = None
    accion_estrategica: str | None = None
    indicador: str | None = None
    estado: str | None = None

class PEIOut(PEIBase):
    id: UUID
    entidad_id: UUID
    
    model_config = ConfigDict(from_attributes=True)

class POIBase(BaseModel):
    codigo_actividad: str
    nombre: str
    area_responsable: str | None = None
    responsable_directo: str | None = None
    unidad_medida: str | None = None
    meta_fisica_anual: Decimal | None = None
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    presupuesto_estimado: Decimal | None = None
    fuente_financiamiento_preliminar: str | None = None
    estado: str = "programada"

class POICreate(POIBase):
    entidad_id: UUID
    pei_id: UUID | None = None

class POIUpdate(BaseModel):
    nombre: str | None = None
    meta_fisica_anual: Decimal | None = None
    presupuesto_estimado: Decimal | None = None
    estado: str | None = None

class POIOut(POIBase):
    id: UUID
    entidad_id: UUID
    pei_id: UUID | None = None
    
    model_config = ConfigDict(from_attributes=True)