from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class DocumentoCreate(BaseModel):
    nombre_archivo: str
    tipo_documento: str
    url_storage: str
    modulo_referencia: str
    registro_id: UUID

class DocumentoOut(BaseModel):
    id: UUID
    nombre_archivo: str
    tipo_documento: str
    url_storage: str
    modulo_referencia: str
    registro_id: UUID
    creado_en: datetime
    
    model_config = ConfigDict(from_attributes=True)