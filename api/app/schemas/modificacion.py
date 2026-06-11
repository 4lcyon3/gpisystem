from pydantic import BaseModel, ConfigDict, field_validator
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

TIPOS_MODIFICACION = ["Habilitacion", "Anulacion", "Credito Suplementario", "Transferencia"]
ESTADOS_MODIFICACION = ["aprobada", "pendiente", "anulada"]


class ModificacionBase(BaseModel):
    entidad_id: UUID
    numero_resolucion: str
    tipo_modificacion: str
    fecha_aprobacion: date
    monto_total: Decimal
    descripcion: str | None = None
    estado: str = "aprobada"

    @field_validator("tipo_modificacion")
    @classmethod
    def validar_tipo(cls, v: str) -> str:
        if v not in TIPOS_MODIFICACION:
            raise ValueError(f"Tipo debe ser uno de: {', '.join(TIPOS_MODIFICACION)}")
        return v

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: str) -> str:
        if v not in ESTADOS_MODIFICACION:
            raise ValueError(f"Estado debe ser uno de: {', '.join(ESTADOS_MODIFICACION)}")
        return v

    @field_validator("numero_resolucion")
    @classmethod
    def validar_resolucion(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("El número de resolución es muy corto")
        return v

    @field_validator("monto_total")
    @classmethod
    def validar_monto(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("El monto debe ser mayor o igual a 0")
        return v


class ModificacionCreate(ModificacionBase):
    pass


class ModificacionUpdate(BaseModel):
    numero_resolucion: str | None = None
    tipo_modificacion: str | None = None
    fecha_aprobacion: date | None = None
    monto_total: Decimal | None = None
    descripcion: str | None = None
    estado: str | None = None


class ModificacionOut(ModificacionBase):
    id: UUID
    creado_en: datetime
    actualizado_en: datetime | None = None
    entidad_nombre: str | None = None

    model_config = ConfigDict(from_attributes=True)