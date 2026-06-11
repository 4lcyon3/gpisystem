# apps/api/app/worker/manager.py
import threading
import time
import logging
from app.db.session import SessionLocal
from app.models.sistema import CargaDatos
from app.worker.tasks import process_file

logger = logging.getLogger(__name__)
_shutdown_flag = threading.Event()
_worker_thread = None

def _worker_loop():
    """Bucle principal del worker que busca tareas pendientes."""
    logger.info("🚀 Worker de procesamiento interno iniciado.")
    
    while not _shutdown_flag.is_set():
        try:
            with SessionLocal() as db:
                # Buscar la carga más antigua en estado pendiente
                pending = db.query(CargaDatos).filter(
                    CargaDatos.estado == 'pendiente'
                ).order_by(CargaDatos.creado_en.asc()).first()
                
                if pending:
                    # Bloquear el registro cambiando el estado inmediatamente
                    pending.estado = 'procesando'
                    db.commit()
                    
                    carga_id = pending.id
                    file_path = pending.nombre_archivo # Aquí guardaremos la ruta temporal
                    
                    logger.info(f"⚙️ Worker procesando carga {carga_id}...")
                    # Ejecutar la lógica pesada de ETL
                    process_file(carga_id, file_path, db)
                else:
                    # No hay trabajo, dormir 5 segundos para no saturar la CPU/BD
                    _shutdown_flag.wait(5)
                    
        except Exception as e:
            logger.error(f"Error crítico en el loop del worker: {e}")
            _shutdown_flag.wait(10) # Esperar antes de reintentar

def start_worker():
    global _worker_thread
    logger.info("🔧 [MANAGER] start_worker() llamado")
    
    if _worker_thread is None or not _worker_thread.is_alive():
        logger.info("🔧 [MANAGER] Creando nuevo hilo worker...")
        _worker_thread = threading.Thread(target=_worker_loop, daemon=True, name="CargasWorker")
        _worker_thread.start()
        logger.info(f"✅ [MANAGER] Worker iniciado en hilo: {_worker_thread.name}")
    else:
        logger.info(f"⚠️ [MANAGER] Worker ya está corriendo: {_worker_thread.is_alive()}")

def stop_worker():
    logger.info("🛑 Deteniendo worker...")
    _shutdown_flag.set()