from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_
from app.db.session import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_role
from app.core.security import get_password_hash
from app.models.sistema import Usuario, Rol, UsuarioRol
from app.schemas.catalogo import UsuarioCreate, UsuarioUpdate, UsuarioOut, UsuarioRolAssign
from typing import Literal
import uuid

router = APIRouter(prefix="/usuarios", tags=["Gestión de Usuarios"])

@router.post("/", response_model=UsuarioOut)
async def crear_usuario(
    data: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))  # Solo Admin
):
    """Crear nuevo usuario con roles (Solo Admin)"""
    # Verificar que username y email no existan
    result = await db.execute(
        select(Usuario).where(
            or_(Usuario.username == data.username, Usuario.email == data.email)
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, "El username o email ya están registrados")
    
    # Crear usuario
    usuario = Usuario(
        id=uuid.uuid4(),
        username=data.username,
        email=data.email,
        password_hash=get_password_hash(data.password),
        activo=data.activo
    )
    db.add(usuario)
    await db.flush()
    
    # Asignar roles
    if data.roles:
        for rol_nombre in data.roles:
            result_rol = await db.execute(select(Rol).where(Rol.nombre == rol_nombre))
            rol = result_rol.scalar_one_or_none()
            if not rol:
                raise HTTPException(400, f"Rol '{rol_nombre}' no encontrado")
            
            db.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
    
    await db.commit()
    await db.refresh(usuario)
    
    # Retornar con roles
    return await _usuario_with_roles(usuario, db)

@router.get("/", response_model=list[UsuarioOut])
async def listar_usuarios(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = None,
    activo: str = Query("true"),  # ← NUEVO
    sort_by: str = Query("creado_en"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))
):
    """Listar usuarios con paginación (Solo Admin)"""
    query = select(Usuario)
    count_query = select(func.count(Usuario.id))
    
    # Filtro de estado
    if activo == "true":
        query = query.where(Usuario.activo == True)
        count_query = count_query.where(Usuario.activo == True)
    elif activo == "false":
        query = query.where(Usuario.activo == False)
        count_query = count_query.where(Usuario.activo == False)
    
    
    if search:
        search_filter = or_(
            Usuario.username.ilike(f"%{search}%"),
            Usuario.email.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    sort_col = getattr(Usuario, sort_by, Usuario.creado_en)
    order_fn = desc if sort_order == "desc" else asc
    query = query.order_by(order_fn(sort_col))
    
    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * limit
    result = await db.execute(query.offset(offset).limit(limit))
    usuarios = result.scalars().all()
    
    # Agregar roles a cada usuario
    usuarios_con_roles = []
    for usuario in usuarios:
        usuarios_con_roles.append(await _usuario_with_roles(usuario, db))
    
    return usuarios_con_roles

@router.put("/{usuario_id}", response_model=UsuarioOut)
async def actualizar_usuario(
    usuario_id: uuid.UUID,
    data: UsuarioUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))  # Solo Admin
):
    """Actualizar usuario (Solo Admin)"""
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(404, "Usuario no encontrado")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        if key == "password" and value:
            usuario.password_hash = get_password_hash(value)
        else:
            setattr(usuario, key, value)
    
    await db.commit()
    await db.refresh(usuario)
    return await _usuario_with_roles(usuario, db)

@router.delete("/{usuario_id}")
async def eliminar_usuario(
    usuario_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))  # Solo Admin
):
    """Eliminar usuario (Solo Admin)"""
    if current_user.id == usuario_id:
        raise HTTPException(400, "No puedes eliminar tu propio usuario")
    
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    usuario = result.scalar_one_or_none()
    if not usuario:
        raise HTTPException(404, "Usuario no encontrado")
    
    await db.delete(usuario)
    await db.commit()
    return {"message": "Usuario eliminado exitosamente"}

@router.post("/asignar-rol")
async def asignar_rol(
    data: UsuarioRolAssign,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))  # Solo Admin
):
    """Asignar rol a usuario (Solo Admin)"""
    # Verificar que exista el usuario
    result_user = await db.execute(select(Usuario).where(Usuario.id == data.usuario_id))
    usuario = result_user.scalar_one_or_none()
    if not usuario:
        raise HTTPException(404, "Usuario no encontrado")
    
    # Verificar que exista el rol
    result_rol = await db.execute(select(Rol).where(Rol.nombre == data.rol_nombre))
    rol = result_rol.scalar_one_or_none()
    if not rol:
        raise HTTPException(404, f"Rol '{data.rol_nombre}' no encontrado")
    
    # Verificar que no tenga ya el rol
    result_existing = await db.execute(
        select(UsuarioRol).where(
            UsuarioRol.usuario_id == data.usuario_id,
            UsuarioRol.rol_id == rol.id
        )
    )
    if result_existing.scalar_one_or_none():
        raise HTTPException(400, f"El usuario ya tiene el rol '{data.rol_nombre}'")
    
    db.add(UsuarioRol(usuario_id=data.usuario_id, rol_id=rol.id))
    await db.commit()
    
    return {"message": f"Rol '{data.rol_nombre}' asignado exitosamente"}

@router.delete("/quitar-rol")
async def quitar_rol(
    data: UsuarioRolAssign,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    _: list[str] = Depends(require_role("Administrador"))  # Solo Admin
):
    """Quitar rol a usuario (Solo Admin)"""
    # Verificar que exista el usuario
    result_user = await db.execute(select(Usuario).where(Usuario.id == data.usuario_id))
    usuario = result_user.scalar_one_or_none()
    if not usuario:
        raise HTTPException(404, "Usuario no encontrado")
    
    # Verificar que exista el rol
    result_rol = await db.execute(select(Rol).where(Rol.nombre == data.rol_nombre))
    rol = result_rol.scalar_one_or_none()
    if not rol:
        raise HTTPException(404, f"Rol '{data.rol_nombre}' no encontrado")
    
    # Buscar la asignación
    result_existing = await db.execute(
        select(UsuarioRol).where(
            UsuarioRol.usuario_id == data.usuario_id,
            UsuarioRol.rol_id == rol.id
        )
    )
    usuario_rol = result_existing.scalar_one_or_none()
    if not usuario_rol:
        raise HTTPException(400, f"El usuario no tiene el rol '{data.rol_nombre}'")
    
    await db.delete(usuario_rol)
    await db.commit()
    
    return {"message": f"Rol '{data.rol_nombre}' quitado exitosamente"}

async def _usuario_with_roles(usuario: Usuario, db: AsyncSession) -> UsuarioOut:
    """Helper para obtener usuario con sus roles"""
    result = await db.execute(
        select(Rol.nombre)
        .join(UsuarioRol, Rol.id == UsuarioRol.rol_id)
        .where(UsuarioRol.usuario_id == usuario.id)
    )
    roles = [row[0] for row in result.all()]
    
    usuario_dict = {
        "id": usuario.id,
        "username": usuario.username,
        "email": usuario.email,
        "activo": usuario.activo,
        "creado_en": usuario.creado_en,
        "actualizado_en": usuario.actualizado_en,
        "roles": roles
    }
    return UsuarioOut(**usuario_dict)