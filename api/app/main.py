import logging

from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import (
    auth, cargas, analitica, catalogos,
    pei_poi, presupuesto, ejecucion, documentos, usuarios, modificaciones,
    disponibilidad
)
from app.worker.manager import start_worker, stop_worker
logger = logging.getLogger(__name__)
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 [MAIN] Aplicación iniciando - starting worker...")
    start_worker()
    logger.info("✅ [MAIN] Worker iniciado")
    yield
    logger.info("🛑 [MAIN] Aplicación cerrando - stopping worker...")
    stop_worker()
    logger.info("✅ [MAIN] Worker detenido")

app = FastAPI(
    title="Sistema Analítico de Compras Públicas",
    description="BI para Perú Compras - OLAP Histórico",
    version="1.0.0",
    lifespan=lifespan
)

# Configurar CORS para Cookies
origins = [
    "http://localhost:5173", # Vite Dev
    "http://localhost:3000",
    # "https://tu-dominio-production.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, # ¡OBLIGATORIO para Cookies HttpOnly!
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(cargas.router, prefix="/api/v1")
app.include_router(analitica.router, prefix="/api/v1")
app.include_router(catalogos.router, prefix="/api/v1")
app.include_router(pei_poi.router, prefix="/api/v1")
app.include_router(presupuesto.router, prefix="/api/v1")
app.include_router(disponibilidad.router, prefix="/api/v1")
app.include_router(ejecucion.router, prefix="/api/v1")
app.include_router(documentos.router, prefix="/api/v1")
app.include_router(usuarios.router, prefix="/api/v1")
app.include_router(modificaciones.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "ok", "system": "Sistema Analítico de Compras Públicas"}

@app.get("/health")
def health():
    return {"status": "healthy"}