from pydantic import BaseModel, ConfigDict
from uuid import UUID

class EntidadOut(BaseModel):
    id: UUID
    nombre: str
    ruc: str
    sector: str | None = None
    
    model_config = ConfigDict(from_attributes=True)

class CentroCostoOut(BaseModel):
    id: UUID
    codigo: str
    nombre: str
    entidad_nombre: str
    
    model_config = ConfigDict(from_attributes=True)

class ClasificadorOut(BaseModel):
    id: UUID
    codigo: str
    descripcion: str
    generica: str | None = None
    
    model_config = ConfigDict(from_attributes=True)