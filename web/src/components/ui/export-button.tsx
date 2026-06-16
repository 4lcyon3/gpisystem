/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

interface ExportButtonProps {
  /** Endpoint base, ej: "/reportes/certificaciones" */
  endpoint: string;
  /** Parámetros de filtro actuales */
  filters?: Record<string, any>;
  /** Si soporta PDF (para documentos individuales) */
  supportsPdf?: boolean;
  /** ID del documento para PDF (si aplica) */
  documentId?: string;
  /** Nombre base del archivo */
  filename?: string;
}

export function ExportButton({
  endpoint,
  filters = {},
  supportsPdf = false,
  documentId,
  filename = 'reporte',
}: ExportButtonProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (formato: 'excel' | 'csv') => {
    setLoading(formato);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '__all__') {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`${endpoint}/${formato}?${params}`, {
        responseType: 'blob',
      });

      // Crear URL y descargar
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const ext = formato === 'excel' ? 'xlsx' : 'csv';
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `${filename}_${timestamp}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Archivo ${ext.toUpperCase()} descargado`);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al generar el archivo');
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!documentId) return;
    setLoading('pdf');
    try {
      const response = await api.get(`${endpoint}/${documentId}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}_${documentId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('PDF descargado');
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={!!loading}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={!!loading}
          className="cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2 text-blue-600" />
          CSV (.csv)
        </DropdownMenuItem>
        {supportsPdf && documentId && (
          <>
            <div className="my-1 border-t" />
            <DropdownMenuItem
              onClick={handleDownloadPdf}
              disabled={!!loading}
              className="cursor-pointer"
            >
              <FileText className="w-4 h-4 mr-2 text-red-600" />
              Descargar PDF
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}