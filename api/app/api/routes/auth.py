from typing_extensions import Literal, cast

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.sistema import Usuario
from app.schemas.auth import LoginRequest, UserOut
from app.core.security import verify_password, create_access_token
from app.core.auth import get_current_user
from app.core.config import settings
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/login")
async def login(
    response: Response,
    form_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    # Buscar usuario
    result = await db.execute(select(Usuario).where(Usuario.username == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
        
    if not user.activo:
        raise HTTPException(status_code=403, detail="Usuario inactivo")

    # Crear Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"user_id": str(user.id)}, expires_delta=access_token_expires
    )

    # Inyectar Cookie HttpOnly
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=access_token,
        httponly=True,      # JS no puede leerla (Anti-XSS)
        secure=settings.COOKIE_SECURE, # Solo HTTPS en prod
        samesite=cast(Literal["lax", "strict", "none"], settings.COOKIE_SAMESITE), # Anti-CSRF
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    
    return {"message": "Login exitoso"}

@router.post("/logout")
async def logout(response: Response):
    # Borrar la cookie
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        path="/",
        samesite=cast(Literal["lax", "strict", "none"], settings.COOKIE_SAMESITE)
    )
    return {"message": "Sesión cerrada"}

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: Usuario = Depends(get_current_user)):
    return current_user