from typing import TYPE_CHECKING

from sqlalchemy import String, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base, TimestampMixin
import uuid


if TYPE_CHECKING:
    from app.models.operativas import Gasto

class Entidad(Base, TimestampMixin):
    __tablename__ = "entidad"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    ruc: Mapped[str] = mapped_column(String(11), unique=True, nullable=False)
    sector: Mapped[str | None] = mapped_column(String(100))
    nivel_gobierno: Mapped[str | None] = mapped_column(String(50))  # Nacional, Regional, Local
    activo: Mapped[bool] = mapped_column(default=True)
    
    centros_costo: Mapped[list["CentroCosto"]] = relationship(back_populates="entidad")
    gastos: Mapped[list["Gasto"]] = relationship("Gasto", back_populates="entidad")

class CentroCosto(Base, TimestampMixin):
    __tablename__ = "centro_costo"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entidad_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("entidad.id"), nullable=False, index=True)
    codigo: Mapped[str] = mapped_column(String(20), nullable=False)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    unidad_organica: Mapped[str | None] = mapped_column(String(150))
    area_usuaria: Mapped[str | None] = mapped_column(String(150))
    activo: Mapped[bool] = mapped_column(default=True)
    
    entidad: Mapped["Entidad"] = relationship(back_populates="centros_costo")
    gastos: Mapped[list["Gasto"]] = relationship("Gasto", back_populates="centro_costo")
    
    __table_args__ = (
        Index("uq_centro_costo_entidad_codigo", "entidad_id", "codigo", unique=True),
    )

class ClasificacionGasto(Base, TimestampMixin):
    __tablename__ = "clasificacion_gasto"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    codigo: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    generica: Mapped[str | None] = mapped_column(String(100))
    subgenerica: Mapped[str | None] = mapped_column(String(100))
    especifica: Mapped[str | None] = mapped_column(String(100))
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    activo: Mapped[bool] = mapped_column(default=True)
    
    gastos: Mapped[list["Gasto"]] = relationship(back_populates="clasificacion_gasto")

class FuenteDatos(Base, TimestampMixin):
    __tablename__ = "fuente_datos"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255))
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)  # SIAF, SEACE, EXCEL, API, MANUAL
    activo: Mapped[bool] = mapped_column(default=True)
    
    gastos: Mapped[list["Gasto"]] = relationship(back_populates="fuente_datos")