# apps/api/app/services/partition_service.py
from sqlalchemy import text
from app.db.session import SessionLocal
from typing import List, Set
import logging

logger = logging.getLogger(__name__)

def ensure_gasto_partitions(years: List[int] | Set[int]) -> None:
    """
    Llama a la función de PostgreSQL para asegurar que las particiones 
    de la tabla 'gasto' existan para los años proporcionados.
    
    Args:
        years: Lista o set de años fiscales (ej. [2024, 2025])
    """
    if not years:
        return
        
    # Usamos set para evitar ejecutar la función múltiples veces para el mismo año
    unique_years = set(years)
        
    with SessionLocal() as db:
        try:
            for year in unique_years:
                # Ejecutamos la función PL/pgSQL que creaste en la BD
                db.execute(
                    text("SELECT crear_particion_si_no_existe(:anio)"),
                    {"anio": year}
                )
                logger.info(f"Verificada/Creada partición para el año {year}")
                
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error al crear particiones para los años {unique_years}: {e}")
            raise RuntimeError(f"Error crítico de infraestructura al preparar particiones: {e}")