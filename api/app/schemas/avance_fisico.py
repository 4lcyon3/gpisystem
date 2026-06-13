from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from uuid import UUID
from datetime import datetime
from decimal import Decimal

MESES_NOMBRES = {
    1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
    5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
    9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
}


class AvanceFisicoBase(BaseModel):
    poi_id: UUID
    entidad_id: UUID
    mes: int
    anio: int
    meta_programada: Decimal = Decimal("0.00")
    meta_ejecutada: Decimal = Decimal("0.00")
    observaciones: str | None = None

    @field_validator("mes")
    @classmethod
    def validar_mes(cls, v: int) -> int:
        if v < 1 or v > 12:
            raise ValueError("El mes debe estar entre 1 y 12")
        return v

    @field_validator("anio")
    @classmethod
    def validar_anio(cls, v: int) -> int:
        if v < 2000 or v > 2100:
            raise ValueError("Año fuera de rango (2000-2100)")
        return v

    @model_validator(mode='after')
    def validar_metas(self):
        if self.meta_programada < 0:
            raise ValueError("La meta programada no puede ser negativa")
        if self.meta_ejecutada < 0:
            raise ValueError("La meta ejecutada no puede ser negativa")
        return self


class AvanceFisicoCreate(AvanceFisicoBase):
    pass


class AvanceFisicoUpdate(BaseModel):
    meta_programada: Decimal | None = None
    meta_ejecutada: Decimal | None = None
    observaciones: str | None = None


class AvanceFisicoOut(AvanceFisicoBase):
    id: UUID
    registrado_por: UUID | None = None
    creado_en: datetime
    actualizado_en: datetime | None = None
    
    # Campos calculados
    porcentaje_avance: float | None = None
    mes_nombre: str | None = None
    
    # Campos relacionados (JOINs)
    entidad_nombre: str | None = None
    poi_codigo: str | None = None
    poi_nombre: str | None = None
    poi_area_responsable: str | None = None
    registrador_nombre: str | None = None
    
    model_config = ConfigDict(from_attributes=True)