from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
import io
import os
import uuid
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation

from app.db.session import SessionLocal
from app.models.sistema import CargaDatos, Usuario
from app.core.auth import get_current_user

router = APIRouter(prefix="/cargas", tags=["Cargas Masivas"])

UPLOAD_DIR = "uploads_temp"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ==========================================
# DESCARGA DE PLANTILLA EXCEL PROFESIONAL
# ==========================================
@router.get("/plantilla")
async def descargar_plantilla_excel(
    _: Usuario = Depends(get_current_user)
):
    """Genera plantilla Excel con validaciones, formato y hoja de instrucciones."""
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Carga de Gastos" # type: ignore
    
    # Columnas que el worker espera
    headers = [
        ("ruc_entidad", 15),
        ("nombre_entidad", 30),
        ("codigo_cc", 15),
        ("nombre_cc", 30),
        ("codigo_clasificador", 20),
        ("desc_clasificador", 40),
        ("fuente_datos", 25),
        ("fecha", 15),
        ("anio_fiscal", 12),
        ("fase", 18),
        ("monto", 18),
    ]
    
    # Estilos
    header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True, size=11, name='Calibri')
    border = Border(
        left=Side(style='thin', color='D1D5DB'),
        right=Side(style='thin', color='D1D5DB'),
        top=Side(style='thin', color='D1D5DB'),
        bottom=Side(style='thin', color='D1D5DB')
    )
    required_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
    
    # Encabezados
    for col_num, (header, width) in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header) # type: ignore
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        cell.border = border
        ws.column_dimensions[chr(64 + col_num) if col_num <= 26 else 'A' + chr(64 + col_num - 26)].width = width # type: ignore
    
    # Datos de ejemplo realistas
    ejemplos = [
        ["20131380014", "Ministerio de Salud", "001", "Dirección General de Salud", 
         "2.3.2.1.1", "Equipos médicos y hospitalarios", "Recursos Ordinarios",
         "2026-01-15", 2026, "certificado", 50000.00],
        ["20131380014", "Ministerio de Salud", "002", "Oficina de Logística",
         "2.3.2.5.1", "Servicios de consultoría", "Recursos Ordinarios",
         "2026-02-20", 2026, "comprometido", 75000.50],
        ["20131380014", "Ministerio de Salud", "001", "Dirección General de Salud",
         "2.1.1.1.1", "Personal docente", "Recursos Ordinarios",
         "2026-03-10", 2026, "devengado", 120000.00],
    ]
    
    for row_num, row_data in enumerate(ejemplos, 2):
        for col_num, value in enumerate(row_data, 1):
            cell = ws.cell(row=row_num, column=col_num, value=value) # type: ignore
            cell.border = border
            cell.font = Font(name='Calibri', size=10)
            
            if col_num == 8:  # fecha
                cell.number_format = 'yyyy-mm-dd'
            elif col_num == 9:  # anio_fiscal
                cell.number_format = '0'
            elif col_num == 11:  # monto
                cell.number_format = '#,##0.00'
    
    # Validaciones de celda
    # Fase (lista desplegable)
    fase_validation = DataValidation(
        type="list",
        formula1='"certificado,comprometido,devengado,girado"',
        allow_blank=False
    )
    fase_validation.error = "Seleccione: certificado, comprometido, devengado o girado"
    fase_validation.errorTitle = "Fase inválida"
    fase_validation.prompt = "Seleccione la fase del gasto"
    fase_validation.promptTitle = "Fase"
    ws.add_data_validation(fase_validation) # type: ignore
    fase_validation.add("J2:J10000")
    
    # Año fiscal (2020-2030)
    anio_validation = DataValidation(
        type="whole", operator="between",
        formula1=2020, formula2=2030, allow_blank=False
    )
    anio_validation.error = "El año debe estar entre 2020 y 2030"
    ws.add_data_validation(anio_validation) # type: ignore
    anio_validation.add("I2:I10000")
    
    # Monto (positivo)
    monto_validation = DataValidation(
        type="decimal", operator="greaterThan",
        formula1=0, allow_blank=False
    )
    monto_validation.error = "El monto debe ser mayor a 0"
    ws.add_data_validation(monto_validation) # type: ignore
    monto_validation.add("K2:K10000")
    
    # Fecha (formato)
    fecha_validation = DataValidation(type="date", allow_blank=False)
    fecha_validation.error = "Formato de fecha inválido (YYYY-MM-DD)"
    ws.add_data_validation(fecha_validation) # type: ignore
    fecha_validation.add("H2:H10000")
    
    # Congelar encabezado
    ws.freeze_panes = "A2" # type: ignore
    
    # Hoja de instrucciones
    ws_instr = wb.create_sheet("Instrucciones")
    instrucciones = [
        ("INSTRUCCIONES PARA LA CARGA MASIVA DE GASTOS", 16, True),
        ("", 11, False),
        ("CAMPOS OBLIGATORIOS:", 12, True),
        ("  • ruc_entidad: RUC de la entidad (11 dígitos)", 11, False),
        ("  • nombre_entidad: Nombre de la entidad", 11, False),
        ("  • codigo_cc: Código del centro de costo", 11, False),
        ("  • nombre_cc: Nombre del centro de costo", 11, False),
        ("  • codigo_clasificador: Código del clasificador de gasto (ej: 2.3.2.1.1)", 11, False),
        ("  • desc_clasificador: Descripción del clasificador", 11, False),
        ("  • fuente_datos: Nombre de la fuente (ej: Recursos Ordinarios)", 11, False),
        ("  • fecha: Fecha en formato YYYY-MM-DD", 11, False),
        ("  • anio_fiscal: Año fiscal (2020-2030)", 11, False),
        ("  • fase: certificado | comprometido | devengado | girado", 11, False),
        ("  • monto: Monto en soles (positivo)", 11, False),
        ("", 11, False),
        ("NOTAS IMPORTANTES:", 12, True),
        ("  • Las entidades, centros de costo, clasificadores y fuentes se crean", 11, False),
        ("    automáticamente si no existen (UPSERT)", 11, False),
        ("  • No modifique los encabezados ni elimine columnas", 11, False),
        ("  • Puede cargar hasta 50,000 registros por archivo", 11, False),
        ("  • Formatos soportados: Excel (.xlsx) y CSV (.csv)", 11, False),
        ("", 11, False),
        ("PROCESAMIENTO:", 12, True),
        ("  1. Suba el archivo desde el módulo de Cargas Masivas", 11, False),
        ("  2. El sistema validará cada fila y mostrará el progreso en tiempo real", 11, False),
        ("  3. Los errores se detallarán en el historial de la carga", 11, False),
    ]
    
    for row_num, (text, size, bold) in enumerate(instrucciones, 1):
        cell = ws_instr.cell(row=row_num, column=1, value=text)
        cell.font = Font(size=size, bold=bold, name='Calibri')
    
    ws_instr.column_dimensions['A'].width = 100
    
    # Guardar
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=plantilla_carga_gastos.xlsx"}
    )


# ==========================================
# UPLOAD (CSV o EXCEL) - Integra con tu worker
# ==========================================
@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: Usuario = Depends(get_current_user)
):
    """
    Recibe archivo CSV o Excel, lo guarda a disco y crea registro en CargaDatos.
    El worker existente se encarga del procesamiento asíncrono con SSE.
    """
    if not file.filename:
        raise HTTPException(400, "Nombre de archivo inválido")
    
    filename_lower = file.filename.lower()
    if not (filename_lower.endswith('.csv') or filename_lower.endswith('.xlsx')):
        raise HTTPException(400, "Solo se permiten archivos CSV o Excel (.xlsx)")
    
    # Determinar tipo y extensión
    file_ext = '.csv' if filename_lower.endswith('.csv') else '.xlsx'
    tipo_archivo = 'csv' if file_ext == '.csv' else 'xlsx'
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        contents = await file.read()
        tamanio_bytes = len(contents)
        
        # Validación rápida: intentar leer el archivo
        try:
            if file_ext == '.csv':
                try:
                    df_preview = pd.read_csv(io.BytesIO(contents), encoding='utf-8', nrows=5)
                except UnicodeDecodeError:
                    df_preview = pd.read_csv(io.BytesIO(contents), encoding='latin-1', nrows=5)
            else:
                df_preview = pd.read_excel(io.BytesIO(contents), nrows=5)
        except Exception as e:
            raise HTTPException(400, f"El archivo no es válido o está corrupto: {str(e)}")
        
        # Validar columnas requeridas
        required_cols = [
            'ruc_entidad', 'nombre_entidad', 'codigo_cc', 'nombre_cc',
            'codigo_clasificador', 'fuente_datos', 'fecha', 'monto', 'fase', 'anio_fiscal'
        ]
        missing = [c for c in required_cols if c not in df_preview.columns]
        if missing:
            raise HTTPException(
                400,
                f"Faltan columnas obligatorias: {', '.join(missing)}. "
                f"Descargue la plantilla oficial para ver el formato correcto."
            )
        
        # Guardar a disco
        with open(file_path, 'wb') as f:
            f.write(contents)
        
        # Crear registro en BD - ADAPTADO a tu modelo real
        with SessionLocal() as db:
            carga = CargaDatos(
                id=uuid.uuid4(),
                nombre_archivo=file_path,           # Ruta temporal (lo usa el worker)
                tipo_archivo=tipo_archivo,          # 'csv' o 'xlsx'
                tamanio_bytes=tamanio_bytes,        # Tamaño en bytes
                estado='pendiente',                 # El worker busca este estado
                filas_total=0,
                filas_ok=0,
                filas_error=0,
                subido_por=current_user.id,         # ✅ Campo correcto (FK a usuario.id)
            )
            db.add(carga)
            db.commit()
            db.refresh(carga)
            
            carga_id = str(carga.id)
        
        return {
            "carga_id": carga_id,
            "mensaje": "Archivo recibido. El procesamiento iniciará en segundos.",
            "archivo": file.filename,
            "tamanio_bytes": tamanio_bytes,
            "tipo_archivo": tipo_archivo,
        }
    
    except HTTPException:
        # Limpiar archivo si hubo error de validación
        if os.path.exists(file_path):
            os.remove(file_path)
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(500, f"Error al procesar el archivo: {str(e)}")