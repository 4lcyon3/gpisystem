from sqlalchemy import String, Integer, Numeric, Date, DateTime, ForeignKey, Index, Text, UniqueConstraint, PrimaryKeyConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.models.dimensionales import CentroCosto, ClasificacionGasto, Entidad, FuenteDatos
from app.models.estrategicas import POI, Presupuesto
from app.db.session import Base, TimestampMixin
import uuid
from datetime import date, datetime

class Gasto(Base, TimestampMixin):
    """
    Tabla principal de hechos. Optimizada para análisis histórico.
    Particionada por anio_fiscal en PostgreSQL.
    """
    __tablename__ = "gasto"
    __table_args__ = (
        # Particionamiento nativo PostgreSQL
        Index("ix_gasto_anio", "anio_fiscal"),
        # Índice BRIN para consultas temporales masivas
        Index("ix_gasto_fecha_brin", "fecha_registro", postgresql_using="brin"),
        # Índice compuesto para dashboards y filtros frecuentes
        Index("ix_gasto_analitico", "entidad_id", "anio_fiscal", "mes", "fase"),
        {"postgresql_partition_by": "RANGE (anio_fiscal)"},

    )
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("entidad.id"), nullable=False)
    centro_costo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("centro_costo.id"), nullable=False)
    clasificacion_gasto_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clasificacion_gasto.id"), nullable=False)
    fuente_datos_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("fuente_datos.id"), nullable=False)
    poi_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("poi.id"))
    presupuesto_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("presupuesto.id"))
    carga_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("carga_datos.id"), nullable=False)
    
    anio_fiscal: Mapped[int] = mapped_column(Integer, primary_key=True)
    mes: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-12
    fecha_registro: Mapped[date] = mapped_column(Date, nullable=False)
    fase: Mapped[str] = mapped_column(String(20), nullable=False)  # certificado, comprometido, devengado, girado
    monto: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False)
    documento_referencia: Mapped[str | None] = mapped_column(String(100))
    observaciones: Mapped[str | None] = mapped_column(Text)
    metadatos: Mapped[dict | None] = mapped_column(JSONB)  # Flexibilidad para campos variables por fuente
    
    entidad: Mapped["Entidad"] = relationship(back_populates="gastos")
    centro_costo: Mapped["CentroCosto"] = relationship(back_populates="gastos")
    clasificacion_gasto: Mapped["ClasificacionGasto"] = relationship(back_populates="gastos")
    fuente_datos: Mapped["FuenteDatos"] = relationship(back_populates="gastos")
    poi: Mapped["POI | None"] = relationship(back_populates="gastos")
    presupuesto: Mapped["Presupuesto | None"] = relationship(back_populates="gastos")

class GastoResumenMensual(Base, TimestampMixin):
    """
    Tabla agregada precalculada por el Worker.
    Alimenta Dashboards y Reportes en <100ms.
    """
    __tablename__ = "gasto_resumen_mensual"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("entidad.id"), nullable=False, index=True)
    centro_costo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("centro_costo.id"), nullable=False, index=True)
    clasificacion_gasto_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clasificacion_gasto.id"), nullable=False, index=True)
    poi_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("poi.id"), index=True)
    anio_fiscal: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    mes: Mapped[int] = mapped_column(Integer, nullable=False)
    
    pia: Mapped[float] = mapped_column(Numeric(16, 2), default=0.00)
    pim: Mapped[float] = mapped_column(Numeric(16, 2), default=0.00)
    certificado: Mapped[float] = mapped_column(Numeric(16, 2), default=0.00)
    comprometido: Mapped[float] = mapped_column(Numeric(16, 2), default=0.00)
    devengado: Mapped[float] = mapped_column(Numeric(16, 2), default=0.00)
    girado: Mapped[float] = mapped_column(Numeric(16, 2), default=0.00)
    saldo_disponible: Mapped[float] = mapped_column(Numeric(16, 2), default=0.00)
    pct_ejecucion: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00)
    ultima_actualizacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint("entidad_id", "centro_costo_id", "clasificacion_gasto_id", "poi_id", "anio_fiscal", "mes",
                         name="uq_resumen_mensual_dimensiones"),
        Index("ix_resumen_dashboard", "entidad_id", "anio_fiscal", "mes"),
    )