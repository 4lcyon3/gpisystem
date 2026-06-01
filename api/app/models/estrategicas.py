from sqlalchemy import String, Integer, Numeric, Date, ForeignKey, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base, TimestampMixin
import uuid
from datetime import date

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.operativas import Gasto
    from app.models.dimensionales import CentroCosto, ClasificacionGasto, FuenteDatos

class PEI(Base, TimestampMixin):
    """Módulo 2: Plan Estratégico Institucional"""
    __tablename__ = "pei"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("entidad.id"), nullable=False, index=True)
    codigo_objetivo: Mapped[str] = mapped_column(String(20), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    accion_estrategica: Mapped[str | None] = mapped_column(Text)
    indicador: Mapped[str | None] = mapped_column(String(255))
    linea_base: Mapped[str | None] = mapped_column(String(100))
    meta_anual: Mapped[str | None] = mapped_column(String(100))
    unidad_medida: Mapped[str | None] = mapped_column(String(50))
    area_responsable: Mapped[str | None] = mapped_column(String(150))
    vigencia_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    vigencia_fin: Mapped[date] = mapped_column(Date, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="vigente")  # vigente, modificado, archivado
    
    pois: Mapped[list["POI"]] = relationship(back_populates="pei")
    
    __table_args__ = (
        Index("uq_pei_entidad_codigo", "entidad_id", "codigo_objetivo", unique=True),
    )

class POI(Base, TimestampMixin):
    """Módulo 3: Plan Operativo Institucional"""
    __tablename__ = "poi"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("entidad.id"), nullable=False, index=True)
    pei_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("pei.id"), index=True)
    codigo_actividad: Mapped[str] = mapped_column(String(20), nullable=False)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    area_responsable: Mapped[str | None] = mapped_column(String(150))
    responsable_directo: Mapped[str | None] = mapped_column(String(150))
    unidad_medida: Mapped[str | None] = mapped_column(String(50))
    meta_fisica_anual: Mapped[float | None] = mapped_column(Numeric(10, 2))
    fecha_inicio: Mapped[date | None] = mapped_column(Date)
    fecha_fin: Mapped[date | None] = mapped_column(Date)
    presupuesto_estimado: Mapped[float | None] = mapped_column(Numeric(15, 2))
    fuente_financiamiento_preliminar: Mapped[str | None] = mapped_column(String(100))
    estado: Mapped[str] = mapped_column(String(20), default="programada")
    
    pei: Mapped["PEI | None"] = relationship(back_populates="pois")
    presupuestos: Mapped[list["Presupuesto"]] = relationship(back_populates="poi")
    gastos: Mapped[list["Gasto"]] = relationship(back_populates="poi")
    
    __table_args__ = (
        Index("uq_poi_entidad_codigo", "entidad_id", "codigo_actividad", unique=True),
    )

class Presupuesto(Base, TimestampMixin):
    """Módulos 4, 5 y 8: Programación, Formulación (PIA/PIM) y Modificaciones"""
    __tablename__ = "presupuesto"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("entidad.id"), nullable=False, index=True)
    poi_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("poi.id"), index=True)
    centro_costo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("centro_costo.id"), nullable=False, index=True)
    clasificacion_gasto_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clasificacion_gasto.id"), nullable=False, index=True)
    fuente_datos_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("fuente_datos.id"), nullable=False, index=True)
    anio_fiscal: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    meta_presupuestal: Mapped[str | None] = mapped_column(String(50))
    pia: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    pim: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    modificaciones_acumuladas: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    
    poi: Mapped["POI | None"] = relationship(back_populates="presupuestos")
    centro_costo: Mapped["CentroCosto"] = relationship("CentroCosto")
    clasificacion_gasto: Mapped["ClasificacionGasto"] = relationship("ClasificacionGasto")
    fuente_datos: Mapped["FuenteDatos"] = relationship("FuenteDatos")
    gastos: Mapped[list["Gasto"]] = relationship(back_populates="presupuesto")
    
    __table_args__ = (
        Index("uq_presupuesto_dimensiones", 
              "entidad_id", "poi_id", "centro_costo_id", "clasificacion_gasto_id", "fuente_datos_id", "anio_fiscal", 
              unique=True),
    )