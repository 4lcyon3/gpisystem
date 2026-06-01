from datetime import datetime

from sqlalchemy import DateTime, String, Integer, Text, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.session import Base, TimestampMixin
import uuid

class Rol(Base, TimestampMixin):
    __tablename__ = "rol"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(255))
    
    usuarios: Mapped[list["UsuarioRol"]] = relationship(back_populates="rol")

class Usuario(Base, TimestampMixin):
    __tablename__ = "usuario"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    activo: Mapped[bool] = mapped_column(default=True)
    
    roles: Mapped[list["UsuarioRol"]] = relationship(back_populates="usuario")

class UsuarioRol(Base):
    __tablename__ = "usuario_rol"
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuario.id", ondelete="CASCADE"), primary_key=True)
    rol_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rol.id", ondelete="CASCADE"), primary_key=True)
    
    usuario: Mapped["Usuario"] = relationship(back_populates="roles")
    rol: Mapped["Rol"] = relationship(back_populates="usuarios")

class CargaDatos(Base, TimestampMixin):
    """Módulo 13 adaptado: Control de imports masivos"""
    __tablename__ = "carga_datos"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre_archivo: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo_archivo: Mapped[str] = mapped_column(String(10), nullable=False)  # csv, xlsx
    tamanio_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # pendiente, procesando, procesado, error
    filas_total: Mapped[int] = mapped_column(Integer, default=0)
    filas_ok: Mapped[int] = mapped_column(Integer, default=0)
    filas_error: Mapped[int] = mapped_column(Integer, default=0)
    subido_por: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuario.id"))
    procesado_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    
    detalles: Mapped[list["CargaDetalle"]] = relationship(back_populates="carga", cascade="all, delete-orphan")

class CargaDetalle(Base):
    __tablename__ = "carga_detalle"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    carga_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("carga_datos.id", ondelete="CASCADE"), index=True)
    numero_fila: Mapped[int] = mapped_column(Integer, nullable=False)
    estado: Mapped[str] = mapped_column(String(20), nullable=False)  # ok, error, omitido
    mensaje_error: Mapped[str | None] = mapped_column(Text)
    datos_raw: Mapped[dict | None] = mapped_column(JSONB)  # Para debugging o re-procesamiento
    
    carga: Mapped["CargaDatos"] = relationship(back_populates="detalles")
    
    __table_args__ = (
        Index("ix_carga_detalle_carga_estado", "carga_id", "estado"),
    )