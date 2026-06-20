from pydantic import BaseModel, ConfigDict, field_validator
from uuid import UUID
from datetime import datetime
from decimal import Decimal

NIVELES_RIESGO = ["normal", "alerta", "critico"]


class EvaluacionPOIBase(BaseModel):
    poi_id: UUID
    entidad_id: UUID
    anio_fiscal: int
    mes_evaluacion: int
    meta_fisica_programada: Decimal = Decimal("0.00")
    meta_fisica_ejecutada: Decimal = Decimal("0.00")
    presupuesto_programado: Decimal = Decimal("0.00")
    presupuesto_ejecutado: Decimal = Decimal("0.00")

    @field_validator("mes_evaluacion")
    @classmethod
    def validar_mes(cls, v: int) -> int:
        if v < 1 or v > 12:
            raise ValueError("El mes debe estar entre 1 y 12")
        return v


class EvaluacionPOICreate(EvaluacionPOIBase):
    pass


class EvaluacionPOIOut(EvaluacionPOIBase):
    id: UUID
    indice_eficacia: Decimal
    indice_eficiencia: Decimal
    porcentaje_ejecucion: Decimal
    nivel_riesgo: str
    creado_en: datetime
    actualizado_en: datetime | None = None
    
    # JOINs
    poi_codigo: str | None = None
    poi_nombre: str | None = None
    entidad_nombre: str | None = None
    
    model_config = ConfigDict(from_attributes=True)


class ResumenEvaluacion(BaseModel):
    """Resumen agregado para dashboard"""
    total_pois: int
    pois_normales: int
    pois_alerta: int
    pois_criticos: int
    eficacia_promedio: float
    eficiencia_promedio: float
    ejecucion_promedio: float
    presupuesto_total: float
    gasto_total: float