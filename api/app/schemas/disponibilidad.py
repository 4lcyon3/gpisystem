from pydantic import BaseModel, ConfigDict, field_validator
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

ESTADOS_DISPONIBILIDAD = ["pendiente", "aprobado", "rechazado"]


class DisponibilidadBase(BaseModel):
    entidad_id: UUID
    centro_costo_id: UUID
    poi_id: UUID
    meta_id: UUID | None = None
    clasificacion_id: UUID
    fuente_id: UUID
    anio_fiscal: int
    numero_solicitud: str
    monto_solicitado: Decimal
    descripcion: str | None = None
    fecha_solicitud: date

    @field_validator("numero_solicitud")
    @classmethod
    def validar_numero(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("El número de solicitud es muy corto")
        return v

    @field_validator("monto_solicitado")
    @classmethod
    def validar_monto(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("El monto debe ser mayor a 0")
        return v

    @field_validator("anio_fiscal")
    @classmethod
    def validar_anio(cls, v: int) -> int:
        if v < 2000 or v > 2100:
            raise ValueError("Año fiscal fuera de rango (2000-2100)")
        return v


class DisponibilidadCreate(DisponibilidadBase):
    pass


class DisponibilidadUpdate(BaseModel):
    numero_solicitud: str | None = None
    monto_solicitado: Decimal | None = None
    descripcion: str | None = None
    meta_id: UUID | None = None


class DisponibilidadAprobar(BaseModel):
    monto_aprobado: Decimal
    observaciones: str | None = None

    @field_validator("monto_aprobado")
    @classmethod
    def validar_monto_aprobado(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("El monto aprobado no puede ser negativo")
        return v


class DisponibilidadRechazar(BaseModel):
    observaciones: str

    @field_validator("observaciones")
    @classmethod
    def validar_observaciones(cls, v: str) -> str:
        if len(v.strip()) < 10:
            raise ValueError("Las observaciones deben tener al menos 10 caracteres")
        return v


class DisponibilidadOut(DisponibilidadBase):
    id: UUID
    monto_aprobado: Decimal
    estado: str
    observaciones: str | None = None
    aprobado_por: UUID | None = None
    fecha_aprobacion: datetime | None = None
    creado_en: datetime
    actualizado_en: datetime | None = None
    
    # Campos relacionados (JOINs)
    entidad_nombre: str | None = None
    centro_costo_nombre: str | None = None
    poi_nombre: str | None = None
    clasificador_codigo: str | None = None
    clasificador_descripcion: str | None = None
    fuente_nombre: str | None = None

    model_config = ConfigDict(from_attributes=True)