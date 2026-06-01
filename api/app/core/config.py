from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

import os
load_dotenv() 


class Settings(BaseSettings):
    # ... otras configs de DB ...
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    DATABASE_URL_SYNC: str = os.getenv("DATABASE_URL_SYNC", "")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")

    # JWT & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = os.getenv("ALGORITHM", "")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 1 día
    
    # Cookie Config
    COOKIE_NAME: str = os.getenv("COOKIE_NAME", "access_token")
    # En producción (HTTPS) debe ser True. En desarrollo local (HTTP) puede ser False.
    COOKIE_SECURE: bool = False 
    # 'lax' es ideal para SameSite si el frontend y backend están en el mismo dominio (o usas proxy en Vite)
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")

    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
    TESTING: bool = os.getenv("TESTING", "False").lower() in ("true", "1", "t")
    

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()