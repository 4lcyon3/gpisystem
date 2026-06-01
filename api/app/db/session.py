"""
Configuración de SQLAlchemy 2.0 con soporte async (FastAPI) y sync (Worker/Alembic).
"""
from datetime import datetime

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    MappedAsDataclass,
    mapped_column,
    sessionmaker,
) 
from sqlalchemy import DateTime, MetaData, create_engine, func
from typing import AsyncGenerator
from app.core.config import settings


convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

# ============================================
# ENGINE ASYNC (para FastAPI endpoints)
# ============================================
async_engine = create_async_engine(
    settings.DATABASE_URL, # type: ignore
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


# ============================================
# ENGINE SYNC (para Worker y Alembic)
# ============================================
sync_engine = create_engine(
    settings.DATABASE_URL_SYNC, # type: ignore
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=5,
    future=True,
) 

SessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)


# ============================================
# BASE DECLARATIVA
# ============================================
class Base(DeclarativeBase):
    """
    Clase base para todos los modelos SQLAlchemy.
    NO incluye tenant_id (single-tenant por instalación).
    
    Usa MappedAsDataclass para habilitar el estilo dataclass 
    de SQLAlchemy 2.0 (constructor con parámetros por nombre).
    """
    metadata = MetaData(naming_convention=convention)
    pass
class TimestampMixin:
    """Mixin para auditoría automática de fechas"""
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
# ============================================
# DEPENDENCIA DE FASTAPI
# ============================================
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency para inyectar la sesión async en los endpoints FastAPI.
    
    Uso:
        @router.get("/ejemplo")
        async def ejemplo(db: AsyncSession = Depends(get_db)):
            # db está disponible aquí
            pass
    
    NOTA: Esta función NO hace commit automático.
    Los servicios son responsables de hacer commit/rollback explícitamente.
    Esto evita conflictos cuando los servicios ya manejan sus transacciones.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            # Solo hacer rollback si hay una excepción no manejada
            await session.rollback()
            raise
        finally:
            # Cerrar la sesión siempre
            await session.close()