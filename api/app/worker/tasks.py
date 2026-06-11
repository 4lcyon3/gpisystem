# apps/api/app/worker/tasks.py
import pandas as pd
import os
import uuid
import logging
import time
from datetime import datetime
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import func, text
from sqlalchemy.orm import Session
from app.models.dimensionales import Entidad, CentroCosto, ClasificacionGasto, FuenteDatos
from app.models.operativas import Gasto
from app.models.sistema import CargaDatos, CargaDetalle
from app.services.partition_service import ensure_gasto_partitions

logger = logging.getLogger(__name__)

def process_file(carga_id: uuid.UUID, file_path: str, db: Session):
    """Procesa el archivo con logging de diagnóstico paso a paso."""
    
    start_time = time.time()
    logger.info(f"🚀 [WORKER] Iniciando proceso para carga {carga_id}")
    logger.info(f"📂 Archivo: {file_path}")
    
    carga = db.get(CargaDatos, carga_id)
    if not carga:
        logger.error(f"❌ [WORKER] Carga {carga_id} no encontrada en BD")
        return
    
    try:
        # ============================================
        # 1. LECTURA DEL ARCHIVO
        # ============================================
        logger.info("📖 [PASO 1] Leyendo archivo...")
        read_start = time.time()
        
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path, encoding='utf-8', on_bad_lines='skip')
        else:
            df = pd.read_excel(file_path)
            
        read_time = time.time() - read_start
        logger.info(f"✅ [PASO 1] Archivo leído en {read_time:.2f}s: {len(df)} filas")
        logger.info(f"📋 Columnas: {list(df.columns)}")
        
        carga.filas_total = len(df)
        db.commit()  # ✅ Commit inmediato para que SSE vea el cambio
        logger.info("✅ [BD] filas_total actualizado y commiteado")

        # ============================================
        # 2. VALIDACIÓN DE COLUMNAS
        # ============================================
        logger.info("🔍 [PASO 2] Validando columnas requeridas...")
        required_cols = ['ruc_entidad', 'nombre_entidad', 'codigo_cc', 'nombre_cc', 
                         'codigo_clasificador', 'fuente_datos', 'fecha', 'monto', 'fase', 'anio_fiscal']
        
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Columnas faltantes: {missing_cols}")
        logger.info("✅ [PASO 2] Todas las columnas requeridas presentes")

        # ============================================
        # 3. NORMALIZACIÓN DE DIMENSIONALES
        # ============================================
        logger.info("🔄 [PASO 3] Normalizando dimensionales...")
        
        # A. ENTIDADES
        if 'nombre_entidad' in df.columns and 'ruc_entidad' in df.columns:
            logger.info("  🏢 Normalizando entidades...")
            entidades_df = df[['ruc_entidad', 'nombre_entidad']].drop_duplicates(subset=['ruc_entidad'], keep='last')
            logger.info(f"    → {len(entidades_df)} entidades únicas")
            
            try:
                stmt_ent = pg_insert(Entidad).values([
                    {
                        "id": uuid.uuid4(), 
                        "ruc": str(row['ruc_entidad']).strip(), 
                        "nombre": str(row['nombre_entidad']).strip(),
                        "activo": True
                    } 
                    for _, row in entidades_df.iterrows()
                ]).on_conflict_do_update(
                    index_elements=['ruc'],
                    set_={"nombre": pg_insert(Entidad).excluded.nombre, "actualizado_en": func.now()}
                ).returning(Entidad.id, Entidad.ruc)
                
                ent_result = db.execute(stmt_ent).fetchall()
                ent_map = {str(row.ruc): row.id for row in ent_result}
                df['entidad_id'] = df['ruc_entidad'].astype(str).str.strip().map(ent_map)
                logger.info(f"  ✅ {len(ent_map)} entidades insertadas/actualizadas")
            except Exception as e:
                logger.error(f"  ❌ Error en entidades: {str(e)}", exc_info=True)
                raise

        # B. FUENTES
        if 'fuente_datos' in df.columns:
            logger.info("  💰 Normalizando fuentes...")
            fuentes_df = df[['fuente_datos']].drop_duplicates(subset=['fuente_datos'], keep='last')
            
            stmt_fuente = pg_insert(FuenteDatos).values([
                {"id": uuid.uuid4(), "nombre": str(row['fuente_datos']).strip(), "tipo": "IMPORTACION", "activo": True} 
                for _, row in fuentes_df.iterrows()
            ]).on_conflict_do_update(
                index_elements=['nombre'],
                set_={"tipo": pg_insert(FuenteDatos).excluded.tipo, "actualizado_en": func.now()}
            ).returning(FuenteDatos.id, FuenteDatos.nombre)
            
            fuente_map = {str(row.nombre): row.id for row in db.execute(stmt_fuente).fetchall()}
            df['fuente_datos_id'] = df['fuente_datos'].astype(str).str.strip().map(fuente_map)
            logger.info(f"  ✅ {len(fuente_map)} fuentes normalizadas")

        # C. CLASIFICADORES
        desc_col = 'desc_clasificador' if 'desc_clasificador' in df.columns else 'descripcion'
        if 'codigo_clasificador' in df.columns and desc_col in df.columns:
            logger.info("  🏷️ Normalizando clasificadores...")
            clasif_df = df[['codigo_clasificador', desc_col]].drop_duplicates(subset=['codigo_clasificador'], keep='last')
            
            stmt_clasif = pg_insert(ClasificacionGasto).values([
                {
                    "id": uuid.uuid4(), 
                    "codigo": str(row['codigo_clasificador']).strip(), 
                    "descripcion": str(row[desc_col]).strip(),
                    "activo": True
                } 
                for _, row in clasif_df.iterrows()
            ]).on_conflict_do_update(
                index_elements=['codigo'],
                set_={"descripcion": pg_insert(ClasificacionGasto).excluded.descripcion, "actualizado_en": func.now()}
            ).returning(ClasificacionGasto.id, ClasificacionGasto.codigo)
            
            clasif_map = {str(row.codigo): row.id for row in db.execute(stmt_clasif).fetchall()}
            df['clasificacion_gasto_id'] = df['codigo_clasificador'].astype(str).str.strip().map(clasif_map)
            logger.info(f"  ✅ {len(clasif_map)} clasificadores normalizados")

        # D. CENTROS DE COSTO
        if all(col in df.columns for col in ['entidad_id', 'codigo_cc', 'nombre_cc']):
            logger.info("  🏢 Normalizando centros de costo...")
            cc_df = df[['entidad_id', 'codigo_cc', 'nombre_cc']].dropna(subset=['entidad_id']).drop_duplicates(subset=['entidad_id', 'codigo_cc'], keep='last')
            
            stmt_cc = pg_insert(CentroCosto).values([
                {
                    "id": uuid.uuid4(), 
                    "entidad_id": row['entidad_id'], 
                    "codigo": str(row['codigo_cc']).strip(), 
                    "nombre": str(row['nombre_cc']).strip(),
                    "activo": True
                } 
                for _, row in cc_df.iterrows()
            ]).on_conflict_do_update(
                index_elements=['entidad_id', 'codigo'],
                set_={"nombre": pg_insert(CentroCosto).excluded.nombre, "actualizado_en": func.now()}
            ).returning(CentroCosto.id, CentroCosto.entidad_id, CentroCosto.codigo)
            
            cc_result = db.execute(stmt_cc).fetchall()
            cc_map = {(row.entidad_id, str(row.codigo)): row.id for row in cc_result}
            df['centro_costo_id'] = df.apply(
                lambda x: cc_map.get((x['entidad_id'], str(x['codigo_cc']).strip())) 
                if pd.notna(x.get('entidad_id')) else None, 
                axis=1
            )
            logger.info(f"  ✅ {len(cc_map)} centros de costo normalizados")

        db.commit()  # ✅ Commit después de normalizar dimensionales
        logger.info("✅ [BD] Dimensionales commiteadas")

        # ============================================
        # 4. ASEGURAR PARTICIONES
        # ============================================
        logger.info("🔧 [PASO 4] Asegurando particiones...")
        anios_unicos = df['anio_fiscal'].dropna().unique().astype(int).tolist()
        ensure_gasto_partitions(anios_unicos)
        logger.info(f"✅ [PASO 4] Particiones verificadas para años: {anios_unicos}")

        # ============================================
        # 5. PREPARAR DATOS DE GASTO
        # ============================================
        logger.info("📊 [PASO 5] Preparando datos de gastos...")
        
        df['fecha_registro'] = pd.to_datetime(df['fecha'], errors='coerce').dt.date
        df['mes'] = pd.to_datetime(df['fecha'], errors='coerce').dt.month
        
        gastos_data = []
        errores = []
        
        for fila_num, (_, row) in enumerate(df.iterrows(), start=2):
            try:
                # Validaciones
                if pd.isna(row.get('entidad_id')):
                    raise ValueError(f"Entidad no encontrada: {row.get('ruc_entidad')}")
                if pd.isna(row.get('centro_costo_id')):
                    raise ValueError(f"CC no encontrado: {row.get('codigo_cc')}")
                if pd.isna(row.get('clasificacion_gasto_id')):
                    raise ValueError(f"Clasificador no encontrado: {row.get('codigo_clasificador')}")
                if pd.isna(row.get('fuente_datos_id')):
                    raise ValueError(f"Fuente no encontrada: {row.get('fuente_datos')}")
                if pd.isna(row.get('fecha_registro')):
                    raise ValueError(f"Fecha inválida: {row.get('fecha')}")
                if pd.isna(row.get('monto')):
                    raise ValueError("Monto vacío")
                
                fase = str(row['fase']).lower().strip()
                if fase not in ['certificado', 'comprometido', 'devengado', 'girado']:
                    raise ValueError(f"Fase inválida: {row['fase']}")
                
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
                    "fase": fase,
                    "monto": float(row['monto'])
                })
            except Exception as e:
                errores.append({"fila": fila_num, "error": str(e)})
        
        logger.info(f"✅ [PASO 5] {len(gastos_data)} filas válidas, {len(errores)} con errores")

        # Registrar errores
        if errores:
            for err in errores[:100]:
                db.add(CargaDetalle(
                    id=uuid.uuid4(),
                    carga_id=carga_id,
                    numero_fila=err['fila'],
                    estado='error',
                    mensaje_error=err['error']
                ))
            carga.filas_error = len(errores)
            db.commit()
            logger.info(f"✅ [BD] {len(errores)} errores registrados")

        # ============================================
        # 6. BULK INSERT DE GASTOS
        # ============================================
        if gastos_data:
            logger.info(f"💾 [PASO 6] Insertando {len(gastos_data)} filas de gasto...")
            total_rows = len(gastos_data)
            batch_size = 1000
            
            for i in range(0, total_rows, batch_size):
                batch = gastos_data[i:i + batch_size]
                stmt_gasto = pg_insert(Gasto).values(batch)
                db.execute(stmt_gasto)
                db.commit()  # ✅ Commit por batch para que SSE vea progreso
                
                carga.filas_ok = min(i + batch_size, total_rows)
                db.commit()  # ✅ Commit del progreso
                logger.info(f"📊 [PROGRESO] {carga.filas_ok}/{total_rows} filas insertadas")
        else:
            logger.warning("⚠️ [PASO 6] No hay filas válidas para insertar")

        # ============================================
        # 7. FINALIZAR
        # ============================================
        logger.info("🎉 [PASO 7] Finalizando proceso...")
        carga.estado = 'procesado'
        carga.procesado_en = datetime.now()
        db.commit()
        
        elapsed = time.time() - start_time
        logger.info(f"✅ [WORKER] Proceso COMPLETADO en {elapsed:.2f}s: {len(gastos_data)} OK, {len(errores)} errores")

    except Exception as e:
        db.rollback()
        elapsed = time.time() - start_time
        logger.error(f"❌ [WORKER] Error CRÍTICO después de {elapsed:.2f}s: {str(e)}", exc_info=True)
        
        carga.estado = 'error'
        db.add(CargaDetalle(
            id=uuid.uuid4(),
            carga_id=carga_id,
            numero_fila=0,
            estado='error',
            mensaje_error=f"Error crítico: {str(e)}"
        ))
        db.commit()
        
    finally:
        # CLEANUP
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"🗑️ [CLEANUP] Archivo eliminado: {file_path}")
            except Exception as e:
                logger.error(f"⚠️ [CLEANUP] No se pudo eliminar: {e}")