from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from uuid import UUID
from datetime import datetime
from decimal import Decimal

TIPOS_PROGRAMACION = ["proyecto", "actividad", "inversion", "servicio"]
ESTADOS_PROGRAMACION = ["borrador", "aprobado", "archivado"]


class ProgramacionDetalleBase(BaseModel):
    anio_fiscal: int
    monto_programado: Decimal = Decimal("0.00")
    meta_fisica: Decimal = Decimal("0.00")
    unidad_medida: str | None = None

    @field_validator("anio_fiscal")
    @classmethod
    def validar_anio(cls, v: int) -> int:
        if v < 2000 or v > 2100:
            raise ValueError("Año fuera de rango (2000-2100)")
        return v

    @field_validator("monto_programado", "meta_fisica")
    @classmethod
    def validar_montos(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Los montos no pueden ser negativos")
        return v


class ProgramacionDetalleCreate(ProgramacionDetalleBase):
    pass


class ProgramacionDetalleOut(ProgramacionDetalleBase):
    id: UUID
    programacion_id: UUID
    creado_en: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ProgramacionBase(BaseModel):
    entidad_id: UUID
    nombre: str
    tipo: str
    anio_inicio: int
    anio_fin: int
    estado: str = "borrador"
    observaciones: str | None = None

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("El nombre debe tener al menos 3 caracteres")
        return v

    @field_validator("tipo")
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        if v not in TIPOS_PROGRAMACION:
            raise ValueError(f"Tipo debe ser uno de: {', '.join(TIPOS_PROGRAMACION)}")
        return v

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: str) -> str:
        if v not in ESTADOS_PROGRAMACION:
            raise ValueError(f"Estado debe ser uno de: {', '.join(ESTADOS_PROGRAMACION)}")
        return v

    @model_validator(mode='after')
    def validar_anios(self):
        if self.anio_inicio > self.anio_fin:
            raise ValueError("El año de inicio debe ser anterior o igual al año fin")
        if self.anio_fin - self.anio_inicio > 5:
            raise ValueError("La programación no puede exceder 5 años")
        return self


class ProgramacionCreate(ProgramacionBase):
    detalles: list[ProgramacionDetalleCreate] = []


class ProgramacionUpdate(BaseModel):
    nombre: str | None = None
    tipo: str | None = None
    estado: str | None = None
    observaciones: str | None = None
    detalles: list[ProgramacionDetalleCreate] | None = None


class ProgramacionOut(ProgramacionBase):
    id: UUID
    creado_en: datetime
    actualizado_en: datetime | None = None
    detalles: list[ProgramacionDetalleOut] = []
    
    # Campos calculados
    monto_total: float = 0.0
    cantidad_anios: int = 0
    
    # JOINs
    entidad_nombre: str | None = None
    
    model_config = ConfigDict(from_attributes=True)