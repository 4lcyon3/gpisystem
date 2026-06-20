from typing import TYPE_CHECKING
from sqlalchemy import CheckConstraint, DateTime, SmallInteger, String, Integer, Numeric, Date, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base, TimestampMixin
import uuid
from datetime import date, datetime

if TYPE_CHECKING:
    from app.models.dimensionales import Entidad
    from app.models.sistema import Usuario

class Disponibilidad(Base, TimestampMixin):
    """Módulo 6: Histórico de solicitudes de saldo (Requerimientos)"""
    __tablename__ = "disponibilidad"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("entidad.id"), nullable=False)
    numero_solicitud: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    poi_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("poi.id"), nullable=False)
    meta_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("meta_presupuestal.id"))
    clasificacion_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clasificacion_gasto.id"))
    fuente_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("fuente_financiamiento.id"))
    monto_solicitado: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    monto_aprobado: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    estado: Mapped[str] = mapped_column(String(20), default="pendiente") # aprobado, rechazado
    fecha_solicitud: Mapped[date] = mapped_column(Date, nullable=False)
    centro_costo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("centro_costo.id"), nullable=False)
    anio_fiscal: Mapped[int] = mapped_column(nullable=False, index=True)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)  # Para rechazo/aprobación
    aprobado_por: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuario.id"), nullable=True)
    fecha_aprobacion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

class CertificacionPresupuestal(Base, TimestampMixin):
    """Módulo 7: Certificaciones que congelan saldo del PIM"""
    __tablename__ = "certificacion_presupuestal"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("entidad.id"), nullable=False, index=True)
    disponibilidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("disponibilidad.id"), nullable=False, index=True)
    numero_certificado: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    monto_certificado: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    fecha_certificacion: Mapped[date] = mapped_column(Date, nullable=False)
    anio_fiscal: Mapped[int] = mapped_column(nullable=False, index=True)
    estado: Mapped[str] = mapped_column(String(20), default="vigente")  # vigente, anulada, ejecutada
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    certificado_por: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuario.id"), nullable=True)
    
    # Relaciones
    disponibilidad: Mapped["Disponibilidad"] = relationship()
    entidad: Mapped["Entidad"] = relationship()
    certificador: Mapped["Usuario"] = relationship()

class ModificacionPresupuestaria(Base, TimestampMixin):
    """Módulo 8: Histórico de cambios al PIA (Generan el PIM)"""
    __tablename__ = "modificacion_presupuestaria"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("entidad.id"), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    numero_resolucion: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    tipo_modificacion: Mapped[str] = mapped_column(String(50), nullable=False) # Habilitacion, Anulacion, Credito
    fecha_aprobacion: Mapped[date] = mapped_column(Date, nullable=False)
    monto_total: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="aprobada")

class ProgramacionMultianual(Base, TimestampMixin):
    """Módulo 4: Programación Multianual - Registro principal (cabecera)"""
    __tablename__ = "programacion_multianual"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("entidad.id"), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)  # Ej: "Construcción Hospital Regional"
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)  # proyecto, actividad, inversion
    anio_inicio: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    anio_fin: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="borrador")  # borrador, aprobado, archivado
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Relaciones
    entidad: Mapped["Entidad"] = relationship()
    detalles: Mapped[list["ProgramacionDetalle"]] = relationship(
        back_populates="programacion",
        cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        CheckConstraint("anio_fin >= anio_inicio", name="ck_prog_anio_valido"),
        CheckConstraint("anio_fin - anio_inicio <= 5", name="ck_prog_max_5_anios"),
    )


class ProgramacionDetalle(Base, TimestampMixin):
    """Módulo 4: Detalle de montos por año fiscal"""
    __tablename__ = "programacion_detalle"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    programacion_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("programacion_multianual.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    anio_fiscal: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    monto_programado: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    meta_fisica: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    unidad_medida: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Relaciones
    programacion: Mapped["ProgramacionMultianual"] = relationship(back_populates="detalles")
    
    __table_args__ = (
        UniqueConstraint("programacion_id", "anio_fiscal", name="uq_prog_detalle_anio"),
    )