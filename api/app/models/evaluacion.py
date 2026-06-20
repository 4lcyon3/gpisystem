from typing import TYPE_CHECKING

from sqlalchemy import Integer, String, ForeignKey, Numeric, DateTime, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.session import Base
from app.models.base import TimestampMixin
import uuid

if TYPE_CHECKING:
    from app.models.estrategicas import POI
    from app.models.dimensionales import Entidad

class EvaluacionPOI(Base, TimestampMixin):
    """
    Módulo 12: Evaluación de eficiencia por POI
    Almacena snapshots periódicos de indicadores calculados
    """
    __tablename__ = "evaluacion_poi"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poi_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("poi.id"), nullable=False, index=True)
    entidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("entidad.id"), nullable=False, index=True)
    anio_fiscal: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    mes_evaluacion: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-12
    
    # Datos de entrada
    meta_fisica_programada: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    meta_fisica_ejecutada: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    presupuesto_programado: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)  # PIM
    presupuesto_ejecutado: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)   # Gasto real
    
    # Indicadores calculados
    indice_eficacia: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00)      # % avance físico
    indice_eficiencia: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00)    # físico/financiero
    porcentaje_ejecucion: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00)  # % gasto
    
    # Clasificación de riesgo
    nivel_riesgo: Mapped[str] = mapped_column(String(20), default="normal")  # normal, alerta, critico
    
    # Relaciones
    poi: Mapped["POI"] = relationship()
    entidad: Mapped["Entidad"] = relationship()
    
    __table_args__ = (
        UniqueConstraint("poi_id", "anio_fiscal", "mes_evaluacion", name="uq_evaluacion_poi_mes"),
    )