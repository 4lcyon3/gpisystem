from pydantic import BaseModel, ConfigDict, field_validator
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

ESTADOS_CERTIFICACION = ["vigente", "anulada", "ejecutada"]


class CertificacionBase(BaseModel):
    entidad_id: UUID
    disponibilidad_id: UUID
    numero_certificado: str
    monto_certificado: Decimal
    fecha_certificacion: date
    anio_fiscal: int
    observaciones: str | None = None
    estado: str = "vigente"

    @field_validator("numero_certificado")
    @classmethod
    def validar_numero(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("El número de certificado es muy corto")
        return v

    @field_validator("monto_certificado")
    @classmethod
    def validar_monto(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("El monto debe ser mayor a 0")
        return v

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v: str) -> str:
        if v not in ESTADOS_CERTIFICACION:
            raise ValueError(f"Estado debe ser uno de: {', '.join(ESTADOS_CERTIFICACION)}")
        return v


class CertificacionCreate(CertificacionBase):
    pass


class CertificacionUpdate(BaseModel):
    observaciones: str | None = None
    estado: str | None = None


class CertificacionOut(CertificacionBase):
    id: UUID
    certificado_por: UUID | None = None
    creado_en: datetime
    actualizado_en: datetime | None = None
    
    # Campos relacionados (JOINs)
    entidad_nombre: str | None = None
    disponibilidad_numero: str | None = None
    disponibilidad_monto_aprobado: Decimal | None = None
    certificador_nombre: str | None = None
    
    model_config = ConfigDict(from_attributes=True)