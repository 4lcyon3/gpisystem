from pydantic import BaseModel, ConfigDict, field_validator
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
    @field_validator(
        'area_responsable', 'responsable_directo', 'unidad_medida',
        'fuente_financiamiento_preliminar',
        mode='before'
    )
    @classmethod
    def empty_string_to_none(cls, v: str | None) -> str | None:
        if isinstance(v, str) and v.strip() == '':
            return None
        return v

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