from typing import List
import uuid

from pydantic import BaseModel, ConfigDict, field_validator
from uuid import UUID

class ClasificadorOut(BaseModel):
    id: UUID
    codigo: str
    descripcion: str
    generica: str | None = None
    
    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID
from datetime import datetime

# ==================== ENTIDADES ====================
class EntidadBase(BaseModel):
    ruc: str
    nombre: str
    sector: str | None = None
    nivel_gobierno: str | None = None
    activo: bool = True

class EntidadCreate(EntidadBase):
    pass

class EntidadUpdate(BaseModel):
    nombre: str | None = None
    sector: str | None = None
    nivel_gobierno: str | None = None
    activo: bool | None = None

class EntidadOut(EntidadBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

# ==================== USUARIOS ====================
class UsuarioBase(BaseModel):
    username: str
    email: EmailStr
    activo: bool = True

class UsuarioCreate(UsuarioBase):
    password: str
    roles: list[str] = []  # Nombres de roles: ["Administrador", "Analista"]

class UsuarioUpdate(BaseModel):
    email: EmailStr | None = None
    activo: bool | None = None
    password: str | None = None

class UsuarioOut(UsuarioBase):
    id: UUID
    creado_en: datetime
    actualizado_en: datetime | None = None
    roles: list[str] = []
    
    model_config = ConfigDict(from_attributes=True)

class UsuarioRolAssign(BaseModel):
    usuario_id: UUID
    rol_nombre: str

class FuenteDatosOut(BaseModel):
    id: UUID
    nombre: str
    tipo: str | None = None
    activo: bool
    
    model_config = ConfigDict(from_attributes=True)


class CentroCostoCreate(BaseModel):
    entidad_id: UUID
    codigo: str
    nombre: str
    activo: bool = True

class CentroCostoOut(CentroCostoCreate):
    id: UUID
    creado_en: datetime
    actualizado_en: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class MetaPresupuestalCreate(BaseModel):
    entidad_id: UUID
    codigo: str
    nombre: str
    anio_fiscal: int

class MetaPresupuestalOut(MetaPresupuestalCreate):
    id: UUID
    creado_en: datetime
    actualizado_en: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


class FuenteFinanciamientoCreate(BaseModel):
    codigo: str
    nombre: str
    tipo_rubro: str | None = None
    activo: bool = True

class FuenteFinanciamientoOut(FuenteFinanciamientoCreate):
    id: UUID
    creado_en: datetime
    actualizado_en: datetime | None = None
    model_config = ConfigDict(from_attributes=True)

class BulkDeleteRequest(BaseModel):
    ids: List[uuid.UUID]

class ClasificacionGastoCreate(BaseModel):
    codigo: str
    descripcion: str
    generica: str | None = None
    subgenerica: str | None = None
    especifica: str | None = None
    activo: bool = True

    @field_validator("codigo")
    @classmethod
    def validar_codigo(cls, v: str) -> str:
        return v.strip()

    @field_validator("descripcion")
    @classmethod
    def validar_descripcion(cls, v: str) -> str:
        return v.strip()


class ClasificacionGastoUpdate(BaseModel):
    descripcion: str | None = None
    generica: str | None = None
    subgenerica: str | None = None
    especifica: str | None = None
    activo: bool | None = None


class ClasificacionGastoOut(ClasificacionGastoCreate):
    id: UUID
    creado_en: datetime
    actualizado_en: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)