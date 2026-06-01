from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenData(BaseModel):
    user_id: UUID | None = None

class UserOut(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    activo: bool
    
    model_config = ConfigDict(from_attributes=True)