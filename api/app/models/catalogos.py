from sqlalchemy import String, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base, TimestampMixin
import uuid

class FuenteFinanciamiento(Base, TimestampMixin):
    """Módulo 1: Fuentes de financiamiento y Rubros"""
    __tablename__ = "fuente_financiamiento"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    tipo_rubro: Mapped[str | None] = mapped_column(String(50)) # Ej: Recursos Ordinarios, Canon
    activo: Mapped[bool] = mapped_column(default=True)

class MetaPresupuestal(Base, TimestampMixin):
    """Módulo 1: Metas presupuestales (Código de cadena presupuestal)"""
    __tablename__ = "meta_presupuestal"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("entidad.id"), nullable=False, index=True)
    codigo: Mapped[str] = mapped_column(String(50), nullable=False) # Ej: 001234
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    anio_fiscal: Mapped[int] = mapped_column(nullable=False)
    
    __table_args__ = (
        UniqueConstraint("entidad_id", "codigo", "anio_fiscal", name="uq_meta_entidad_anio"),
    )