from sqlalchemy import DateTime, String, Integer, Numeric, Date, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base, TimestampMixin
import uuid
from datetime import date, datetime

class ProgramacionMultianual(Base, TimestampMixin):
    """Módulo 4: Proyección de necesidades a futuro"""
    __tablename__ = "programacion_multianual"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("entidad.id"), nullable=False)
    poi_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("poi.id"), nullable=False)
    anio_programacion: Mapped[int] = mapped_column(Integer, nullable=False) # Año futuro
    monto_solicitado: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    monto_aprobado: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    prioridad: Mapped[str] = mapped_column(String(20)) # Alta, Media, Baja
    justificacion: Mapped[str | None] = mapped_column(Text)

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

class Certificacion(Base, TimestampMixin):
    """Módulo 7: Histórico de reservas de presupuesto"""
    __tablename__ = "certificacion"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    numero_certificacion: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    disponibilidad_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("disponibilidad.id"))
    monto_certificado: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    fecha_certificacion: Mapped[date] = mapped_column(Date, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="vigente") # vigente, anulada

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