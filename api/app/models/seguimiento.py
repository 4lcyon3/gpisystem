from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, SmallInteger, String, Integer, Numeric, Date, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base, TimestampMixin
import uuid
from datetime import date

if TYPE_CHECKING:
    from app.models.dimensionales import Entidad
    from app.models.sistema import Usuario
    from app.models.estrategicas import POI

class AvanceFisico(Base, TimestampMixin):
    """Módulo 10: Registro mensual del avance físico de actividades del POI"""
    __tablename__ = "avance_fisico"
    
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poi_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("poi.id"), nullable=False, index=True)
    entidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("entidad.id"), nullable=False, index=True)
    mes: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 1-12
    anio: Mapped[int] = mapped_column(SmallInteger, nullable=False, index=True)
    meta_programada: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    meta_ejecutada: Mapped[float] = mapped_column(Numeric(15, 2), default=0.00)
    observaciones: Mapped[str | None] = mapped_column(Text, nullable=True)
    registrado_por: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuario.id"), nullable=True)
    
    # Relaciones
    poi: Mapped["POI"] = relationship()
    entidad: Mapped["Entidad"] = relationship()
    registrador: Mapped["Usuario"] = relationship()
    
    __table_args__ = (
        UniqueConstraint("poi_id", "mes", "anio", name="uq_avance_poi_mes_anio"),
        CheckConstraint("mes >= 1 AND mes <= 12", name="ck_avance_mes_valido"),
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