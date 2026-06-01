from fastapi import Depends, HTTPException, status, Request
from fastapi.security import APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.sistema import Usuario
from app.db.session import get_db # Asumiendo que tienes tu sesión de BD configurada
from .security import decode_access_token
from .config import settings

async def get_current_user(
    request: Request, 
    db: AsyncSession = Depends(get_db)
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado o sesión expirada",
        headers={"WWW-Authenticate": "Cookie"},
    )
    
    # 1. Extraer el token de la Cookie HttpOnly
    token = request.cookies.get(settings.COOKIE_NAME)
    if not token:
        raise credentials_exception
        
    # 2. Decodificar el JWT
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id: str = payload.get("user_id", "sub")
    if user_id is None:
        raise credentials_exception
        
    # 3. Buscar usuario en la BD
    from uuid import UUID
    result = await db.execute(select(Usuario).where(Usuario.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    
    if user is None or not user.activo:
        raise credentials_exception
        
    return user