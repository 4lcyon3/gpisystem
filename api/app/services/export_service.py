import io
import pandas as pd
from datetime import datetime
from fpdf import FPDF
from typing import List, Dict, Any

class ExportService:
    """Servicio centralizado para exportación de datos"""
    
    @staticmethod
    def to_excel(data: List[Dict], columns: Dict[str, str], sheet_name: str = "Datos") -> io.BytesIO:
        """
        Exporta datos a Excel con formato profesional.
        
        Args:
            data: Lista de diccionarios con los datos
            columns: Dict {campo: "Nombre Visible"} de columnas a exportar
            sheet_name: Nombre de la hoja
        """
        df = pd.DataFrame(data)
        
        # Seleccionar y renombrar columnas
        df = df[[col for col in columns.keys() if col in df.columns]]
        df = df.rename(columns=columns)
        
        # Crear buffer
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False, startrow=1)
            
            # Formato
            workbook = writer.book
            worksheet = writer.sheets[sheet_name]
            
            # Ajustar anchos
            for i, col in enumerate(df.columns, 1):
                max_len = max(
                    df[col].astype(str).apply(len).max(),
                    len(col)
                ) + 2
                worksheet.column_dimensions[chr(64 + i)].width = min(max_len, 50)
        
        output.seek(0)
        return output
    
    @staticmethod
    def to_csv(data: List[Dict], columns: Dict[str, str]) -> io.BytesIO:
        """Exporta datos a CSV"""
        df = pd.DataFrame(data)
        df = df[[col for col in columns.keys() if col in df.columns]]
        df = df.rename(columns=columns)
        
        output = io.BytesIO()
        # BOM UTF-8 para Excel
        output.write(b'\xef\xbb\xbf')
        output.write(df.to_csv(index=False).encode('utf-8'))
        output.seek(0)
        return output
    
    @staticmethod
    def generate_certificado_pdf(certificado: Dict) -> io.BytesIO:
        """Genera PDF del Certificado de Crédito Presupuestario"""
        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)
        
        # Header
        pdf.set_font('Helvetica', 'B', 16)
        pdf.cell(0, 10, 'CERTIFICADO DE CREDITO PRESUPUESTARIO', 0, 1, 'C') # type: ignore
        pdf.set_font('Helvetica', '', 10)
        pdf.cell(0, 6, f'N° {certificado.get("numero_certificado", "")}', 0, 1, 'C') # type: ignore
        pdf.ln(5)
        
        # Línea separadora
        pdf.set_draw_color(0, 51, 153)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(8)
        
        # Información general
        pdf.set_font('Helvetica', 'B', 11)
        pdf.cell(40, 7, 'Entidad:', 0, 0) # type: ignore
        pdf.set_font('Helvetica', '', 11)
        pdf.multi_cell(0, 7, certificado.get('entidad_nombre', ''))
        
        pdf.set_font('Helvetica', 'B', 11)
        pdf.cell(40, 7, 'Fecha:', 0, 0) # type: ignore
        pdf.set_font('Helvetica', '', 11)
        pdf.cell(0, 7, certificado.get('fecha_certificacion', ''), 0, 1) # type: ignore
        
        pdf.set_font('Helvetica', 'B', 11)
        pdf.cell(40, 7, 'Anio Fiscal:', 0, 0) # type: ignore
        pdf.set_font('Helvetica', '', 11)
        pdf.cell(0, 7, str(certificado.get('anio_fiscal', '')), 0, 1) # type: ignore
        
        pdf.set_font('Helvetica', 'B', 11)
        pdf.cell(40, 7, 'Estado:', 0, 0) # type: ignore
        pdf.set_font('Helvetica', '', 11)
        pdf.cell(0, 7, certificado.get('estado', '').upper(), 0, 1) # type: ignore
        
        pdf.ln(5)
        
        # Disponibilidad vinculada
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(0, 8, 'VINCULACION PRESUPUESTAL', 0, 1) # type: ignore
        pdf.set_font('Helvetica', '', 11)
        pdf.cell(40, 7, 'Disponibilidad:', 0, 0) # type: ignore
        pdf.cell(0, 7, certificado.get('disponibilidad_numero', ''), 0, 1) # type: ignore
        pdf.ln(3)
        
        # Montos
        pdf.set_fill_color(240, 248, 255)
        pdf.set_font('Helvetica', 'B', 11)
        pdf.cell(95, 8, 'Monto Aprobado (Disp.)', 1, 0, 'C', True) # type: ignore
        pdf.cell(95, 8, 'Monto Certificado', 1, 1, 'C', True) # type: ignore
        
        pdf.set_font('Helvetica', '', 12)
        monto_aprobado = certificado.get('disponibilidad_monto_aprobado', 0) or 0
        monto_certificado = certificado.get('monto_certificado', 0) or 0
        
        pdf.cell(95, 10, f'S/ {monto_aprobado:,.2f}', 1, 0, 'R') # type: ignore
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(95, 10, f'S/ {monto_certificado:,.2f}', 1, 1, 'R') # type: ignore
        
        pdf.ln(5)
        
        # Observaciones
        if certificado.get('observaciones'):
            pdf.set_font('Helvetica', 'B', 11)
            pdf.cell(0, 7, 'OBSERVACIONES', 0, 1) # type: ignore
            pdf.set_font('Helvetica', '', 10)
            pdf.multi_cell(0, 6, certificado.get('observaciones', ''))
            pdf.ln(3)
        
        # Footer
        pdf.ln(10)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(5)
        pdf.set_font('Helvetica', 'I', 9)
        pdf.cell(0, 5, f'Certificado por: {certificado.get("certificador_nombre", "Sistema")}', 0, 1, 'C') # type: ignore
        pdf.cell(0, 5, f'Emitido: {datetime.now().strftime("%d/%m/%Y %H:%M")}', 0, 1, 'C') # type: ignore
        
        # Output
        output = io.BytesIO()
        output.write(pdf.output())
        output.seek(0)
        return output
    
    @staticmethod
    def generate_modificacion_pdf(modificacion: Dict) -> io.BytesIO:
        """Genera PDF de la Resolucion de Modificacion Presupuestaria"""
        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)
        
        # Header
        pdf.set_font('Helvetica', 'B', 16)
        pdf.cell(0, 10, 'RESOLUCION DE MODIFICACION PRESUPUESTARIA', 0, 1, 'C') # type: ignore
        pdf.set_font('Helvetica', '', 10)
        pdf.cell(0, 6, f'{modificacion.get("numero_resolucion", "")}', 0, 1, 'C') # type: ignore
        pdf.ln(5)
        
        pdf.set_draw_color(0, 51, 153)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(8)
        
        # Info general
        pdf.set_font('Helvetica', 'B', 11)
        pdf.cell(40, 7, 'Entidad:', 0, 0) # type: ignore
        pdf.set_font('Helvetica', '', 11)
        pdf.multi_cell(0, 7, modificacion.get('entidad_nombre', ''))
        
        pdf.set_font('Helvetica', 'B', 11)
        pdf.cell(40, 7, 'Fecha:', 0, 0) # type: ignore
        pdf.set_font('Helvetica', '', 11)
        pdf.cell(0, 7, modificacion.get('fecha_aprobacion', ''), 0, 1) # type: ignore
        
        pdf.set_font('Helvetica', 'B', 11)
        pdf.cell(40, 7, 'Tipo:', 0, 0) # type: ignore
        pdf.set_font('Helvetica', '', 11)
        pdf.cell(0, 7, modificacion.get('tipo_modificacion', ''), 0, 1) # type: ignore
        
        pdf.set_font('Helvetica', 'B', 11)
        pdf.cell(40, 7, 'Estado:', 0, 0) # type: ignore
        pdf.set_font('Helvetica', '', 11)
        pdf.cell(0, 7, modificacion.get('estado', '').upper(), 0, 1) # type: ignore
        
        pdf.ln(5)
        
        # Monto
        pdf.set_fill_color(240, 248, 255)
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(0, 10, f'MONTO TOTAL: S/ {modificacion.get("monto_total", 0):,.2f}', 1, 1, 'C', True) # type: ignore
        
        pdf.ln(5)
        
        # Descripcion
        if modificacion.get('descripcion'):
            pdf.set_font('Helvetica', 'B', 11)
            pdf.cell(0, 7, 'DESCRIPCION Y JUSTIFICACION', 0, 1) # type: ignore
            pdf.set_font('Helvetica', '', 10)
            pdf.multi_cell(0, 6, modificacion.get('descripcion', ''))
        
        # Footer
        pdf.ln(10)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(5)
        pdf.set_font('Helvetica', 'I', 9)
        pdf.cell(0, 5, f'Emitido: {datetime.now().strftime("%d/%m/%Y %H:%M")}', 0, 1, 'C') # type: ignore
        
        output = io.BytesIO()
        output.write(pdf.output())
        output.seek(0)
        return output

export_service = ExportService()