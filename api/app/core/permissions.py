# app/core/permissions.py
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.sistema import Usuario, UsuarioRol, Rol
from typing import List

async def get_user_roles(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> List[str]:
    """Obtiene los nombres de los roles del usuario actual"""
    result = await db.execute(
        select(Rol.nombre)
        .join(UsuarioRol, Rol.id == UsuarioRol.rol_id)
        .where(UsuarioRol.usuario_id == current_user.id)
    )
    return [row[0] for row in result.all()]

def require_role(*allowed_roles: str):
    """
    Dependencia que valida si el usuario tiene al menos uno de los roles permitidos.
    
    Uso:
        @router.get("/admin-only")
        async def admin_only(roles: List[str] = Depends(require_role("Administrador"))):
            return {"message": "Solo administradores"}
    """
    async def role_checker(
        roles: List[str] = Depends(get_user_roles)
    ):
        if not any(role in roles for role in allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado. Roles requeridos: {', '.join(allowed_roles)}"
            )
        return roles
    
    return role_checker