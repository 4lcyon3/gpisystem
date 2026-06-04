from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.permissions import require_role
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.sistema import Usuario
from app.models.seguimiento import Documento
from app.schemas.documentos import DocumentoCreate, DocumentoOut
import uuid
import os
import shutil

router = APIRouter(prefix="/documentos", tags=["Gestión Documental"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=DocumentoOut)
async def subir_documento(
    file: UploadFile = File(...),
    tipo_documento: str = "general",
    modulo_referencia: str = "general",
    registro_id: str = "",
    db: AsyncSession = Depends(get_db),
    roles: list[str] = Depends(require_role("Administrador", "Analista"))
):
    """Sube un documento y lo vincula a cualquier registro del sistema"""
    # Guardar archivo físicamente
    if not file.filename:
        raise ValueError("El archivo no tiene nombre")

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Crear registro en BD
    doc = Documento(
        id=uuid.uuid4(),
        nombre_archivo=file.filename,
        tipo_documento=tipo_documento,
        url_storage=file_path,
        modulo_referencia=modulo_referencia,
        registro_id=uuid.UUID(registro_id) if registro_id else uuid.uuid4()
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    
    return doc

@router.get("/", response_model=list[DocumentoOut])
async def listar_documentos(
    modulo: str | None = None,
    registro_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    query = select(Documento).order_by(desc(Documento.creado_en))
    if modulo:
        query = query.where(Documento.modulo_referencia == modulo)
    if registro_id:
        query = query.where(Documento.registro_id == registro_id)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{doc_id}", response_model=DocumentoOut)
async def obtener_documento(
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: list[str] = Depends(require_role("Administrador", "Analista", "Auditor"))
):
    result = await db.execute(select(Documento).where(Documento.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Documento no encontrado")
    return doc