from pydantic import BaseModel, ConfigDict
from uuid import UUID
from decimal import Decimal

class PresupuestoBase(BaseModel):
    anio_fiscal: int
    meta_presupuestal: str | None = None
    pia: Decimal = Decimal("0.00")
    pim: Decimal = Decimal("0.00")
    modificaciones_acumuladas: Decimal = Decimal("0.00")

class PresupuestoCreate(PresupuestoBase):
    entidad_id: UUID
    poi_id: UUID | None = None
    centro_costo_id: UUID
    clasificacion_gasto_id: UUID
    fuente_datos_id: UUID

class PresupuestoUpdate(BaseModel):
    pia: Decimal | None = None
    pim: Decimal | None = None
    modificaciones_acumuladas: Decimal | None = None

class PresupuestoOut(PresupuestoBase):
    id: UUID
    entidad_id: UUID
    poi_id: UUID | None = None
    centro_costo_id: UUID
    clasificacion_gasto_id: UUID
    fuente_datos_id: UUID
    
    model_config = ConfigDict(from_attributes=True)

class ProgramacionMultianualCreate(BaseModel):
    entidad_id: UUID
    poi_id: UUID
    anio_programacion: int
    monto_solicitado: Decimal
    monto_aprobado: Decimal = Decimal("0.00")
    prioridad: str
    justificacion: str | None = None

class ProgramacionMultianualOut(BaseModel):
    id: UUID
    entidad_id: UUID
    poi_id: UUID
    anio_programacion: int
    monto_solicitado: Decimal
    monto_aprobado: Decimal
    prioridad: str
    
    model_config = ConfigDict(from_attributes=True)