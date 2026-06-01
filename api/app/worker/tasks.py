# apps/api/app/worker/tasks.py
import pandas as pd
import os
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session
from app.models.dimensionales import Entidad, CentroCosto, ClasificacionGasto, FuenteDatos
from app.models.operativas import Gasto
from app.models.sistema import CargaDatos, CargaDetalle
from app.services.partition_service import ensure_gasto_partitions
import logging

logger = logging.getLogger(__name__)

def process_file(carga_id: uuid.UUID, file_path: str, db: Session):
    """Procesa el archivo, normaliza dimensionales e inserta en la tabla particionada."""
    carga = db.get(CargaDatos, carga_id)
    
    try:
        # 1. LECTURA DEL ARCHIVO
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
            
        carga.filas_total = len(df) # type: ignore
        db.commit()
        
        # Validación rápida de columnas
        required_cols = ['ruc_entidad', 'nombre_entidad', 'codigo_cc', 'nombre_cc', 
                         'codigo_clasificador', 'fuente_datos', 'fecha', 'monto', 'fase', 'anio_fiscal']
        if not all(col in df.columns for col in required_cols):
            raise ValueError(f"Estructura inválida. Faltan columnas requeridas.")

        # 2. NORMALIZACIÓN DE DIMENSIONALES (UPSERT MASIVO)
        # A. Entidades (Clave única: ruc)
        entidades_df = df[['ruc_entidad', 'nombre_entidad']].drop_duplicates()
        stmt_ent = pg_insert(Entidad).values([
            {"id": uuid.uuid4(), "ruc": row['ruc_entidad'], "nombre": row['nombre_entidad']} 
            for _, row in entidades_df.iterrows()
        ]).on_conflict_do_update(
            index_elements=['ruc'],
            set_={"nombre": pg_insert(Entidad).excluded.nombre}
        ).returning(Entidad.id, Entidad.ruc)
        
        ent_map = {row.ruc: row.id for row in db.execute(stmt_ent).fetchall()}
        df['entidad_id'] = df['ruc_entidad'].map(ent_map)

        # B. Fuentes de Datos
        fuentes_df = df[['fuente_datos']].drop_duplicates()
        stmt_fuente = pg_insert(FuenteDatos).values([
            {"id": uuid.uuid4(), "nombre": row['fuente_datos'], "tipo": "IMPORTACION"} 
            for _, row in fuentes_df.iterrows()
        ]).on_conflict_do_update(
            index_elements=['nombre'],
            set_={"tipo": pg_insert(FuenteDatos).excluded.tipo}
        ).returning(FuenteDatos.id, FuenteDatos.nombre)
        
        fuente_map = {row.nombre: row.id for row in db.execute(stmt_fuente).fetchall()}
        df['fuente_datos_id'] = df['fuente_datos'].map(fuente_map)

        # C. Clasificadores
        clasif_df = df[['codigo_clasificador', 'desc_clasificador']].drop_duplicates()
        # Asumiendo que desc_clasificador existe en el excel, si no, mapear a 'descripcion'
        desc_col = 'desc_clasificador' if 'desc_clasificador' in df.columns else 'descripcion'
        stmt_clasif = pg_insert(ClasificacionGasto).values([
            {"id": uuid.uuid4(), "codigo": row['codigo_clasificador'], "descripcion": row[desc_col]} 
            for _, row in clasif_df.iterrows()
        ]).on_conflict_do_update(
            index_elements=['codigo'],
            set_={"descripcion": pg_insert(ClasificacionGasto).excluded.descripcion}
        ).returning(ClasificacionGasto.id, ClasificacionGasto.codigo)
        
        clasif_map = {row.codigo: row.id for row in db.execute(stmt_clasif).fetchall()}
        df['clasificacion_gasto_id'] = df['codigo_clasificador'].map(clasif_map)

        # D. Centros de Costo (Clave compuesta: entidad_id + codigo)
        cc_df = df[['entidad_id', 'codigo_cc', 'nombre_cc']].drop_duplicates()
        stmt_cc = pg_insert(CentroCosto).values([
            {"id": uuid.uuid4(), "entidad_id": row['entidad_id'], "codigo": row['codigo_cc'], "nombre": row['nombre_cc']} 
            for _, row in cc_df.iterrows()
        ]).on_conflict_do_update(
            index_elements=['entidad_id', 'codigo'],
            set_={"nombre": pg_insert(CentroCosto).excluded.nombre}
        ).returning(CentroCosto.id, CentroCosto.entidad_id, CentroCosto.codigo)
        
        cc_map = {(row.entidad_id, row.codigo): row.id for row in db.execute(stmt_cc).fetchall()}
        df['centro_costo_id'] = df.apply(lambda x: cc_map.get((x['entidad_id'], x['codigo_cc'])), axis=1)

        # 3. ASEGURAR PARTICIONES (Llamada a tu función de BD)
        anios_unicos = df['anio_fiscal'].dropna().unique().astype(int).tolist()
        ensure_gasto_partitions(anios_unicos)

        # 4. PREPARAR DATOS PARA TABLA DE HECHOS (GASTO)
        df['fecha_registro'] = pd.to_datetime(df['fecha']).dt.date
        df['mes'] = pd.to_datetime(df['fecha']).dt.month
        
        gastos_data = []
        for _, row in df.iterrows():
            gastos_data.append({
                "id": uuid.uuid4(),
                "entidad_id": row['entidad_id'],
                "centro_costo_id": row['centro_costo_id'],
                "clasificacion_gasto_id": row['clasificacion_gasto_id'],
                "fuente_datos_id": row['fuente_datos_id'],
                "carga_id": carga_id,
                "anio_fiscal": int(row['anio_fiscal']),
                "mes": int(row['mes']),
                "fecha_registro": row['fecha_registro'],
                "fase": str(row['fase']).lower(),
                "monto": float(row['monto'])
            })
            
        # 5. BULK INSERT POR LOTES (Para no saturar la RAM y permitir progreso en tiempo real)
        total_rows = len(gastos_data)
        batch_size = 10000 # Insertamos de 10k en 10k
        
        for i in range(0, total_rows, batch_size):
            batch = gastos_data[i:i + batch_size]
            stmt_gasto = pg_insert(Gasto).values(batch)
            db.execute(stmt_gasto)
            db.commit()
            
            # Actualizar progreso (Esto es lo que leerá el SSE para el Frontend)
            carga.filas_ok = min(i + batch_size, total_rows) # type: ignore
            db.commit()
            
        # 6. ÉXITO
        carga.estado = 'procesado' # type: ignore
        carga.procesado_en = datetime.now() # type: ignore
        db.commit()
        logger.info(f"✅ Éxito: {total_rows} filas procesadas.")

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error procesando archivo {file_path}: {str(e)}")
        carga.estado = 'error' # type: ignore
        db.add(CargaDetalle(
            id=uuid.uuid4(),
            carga_id=carga_id,
            numero_fila=0,
            estado='error',
            mensaje_error=str(e)
        ))
        db.commit()
        
    finally:
        # 7. CLEANUP AUTOMÁTICO (Descartar archivo)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"🗑️ Archivo temporal eliminado: {file_path}")
            except Exception as e:
                logger.error(f"No se pudo eliminar el archivo temporal: {e}")