from sqlalchemy import String, Integer, Numeric, Date, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base, TimestampMixin
import uuid
from datetime import date

class AvanceFisico(Base, TimestampMixin):
    """Módulo 10: Histórico del avance real de las actividades (No financiero)"""
    __tablename__ = "avance_fisico"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poi_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("poi.id"), nullable=False, index=True)
    anio_fiscal: Mapped[int] = mapped_column(Integer, nullable=False)
    mes: Mapped[int] = mapped_column(Integer, nullable=False) # 1-12
    meta_programada: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    avance_ejecutado: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    porcentaje_avance: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00)
    evidencia: Mapped[str | None] = mapped_column(Text)
    
    __table_args__ = (
        Index("ix_avance_fisico_poi_mes", "poi_id", "anio_fiscal", "mes", unique=True),
    )

class Alerta(Base, TimestampMixin):
    """Módulo 11: Registro histórico de alertas detectadas por el Worker"""
    __tablename__ = "alerta"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("entidad.id"), nullable=False)
    poi_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("poi.id"))
    tipo_alerta: Mapped[str] = mapped_column(String(50), nullable=False) # Ej: "Baja ejecucion", "Sin presupuesto"
    nivel: Mapped[str] = mapped_column(String(20), nullable=False) # Rojo, Amarillo, Verde
    mensaje: Mapped[str] = mapped_column(Text, nullable=False)
    fecha_deteccion: Mapped[date] = mapped_column(Date, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), default="activa") # activa, resuelta, ignorada

class Documento(Base, TimestampMixin):
    """Módulo 13: Gestión documental polimórfica (Se adjunta a cualquier módulo)"""
    __tablename__ = "documento"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre_archivo: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo_documento: Mapped[str] = mapped_column(String(50), nullable=False) # Resolucion, Informe, Sustento
    url_storage: Mapped[str] = mapped_column(String(500), nullable=False) # Ruta en S3/MinIO/Local
    
    # Polimorfismo: A qué registro pertenece
    modulo_referencia: Mapped[str] = mapped_column(String(50), nullable=False) # "pei", "poi", "certificacion"
    registro_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    
    __table_args__ = (
        Index("ix_documento_referencia", "modulo_referencia", "registro_id"),
    )