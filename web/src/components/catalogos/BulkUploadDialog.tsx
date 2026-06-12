import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useImportarCatalogo, descargarPlantilla } from '@/hooks/useCatalogos';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: 'centros-costo' | 'metas-presupuestales' | 'fuentes-financiamiento';
  titulo: string;
  descripcion: string;
}

export function BulkUploadDialog({ open, onOpenChange, tipo, titulo, descripcion }: BulkUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const importMutation = useImportarCatalogo(tipo);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    onDrop: (accepted) => {
      if (accepted.length > 0) setFile(accepted[0]);
    },
  });

  const handleUpload = async () => {
    if (!file) {
      toast.error('Debes seleccionar un archivo CSV');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Solo se permiten archivos CSV');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande (máximo 5MB)');
      return;
    }
    
    try {
      await importMutation.mutateAsync(file);
      setFile(null);
      onOpenChange(false);
    } catch (error) {
      // El error ya se maneja en el onError del hook
      console.error('Error al subir:', error);
    }
  };

  const handleClose = () => {
    if (!importMutation.isPending) {
      setFile(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            {titulo}
          </DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Paso 1: Descargar Plantilla */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900">Paso 1: Descarga la plantilla</p>
              <p className="text-xs text-blue-700 mt-0.5">El archivo debe respetar exactamente esta estructura.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => descargarPlantilla(tipo)} className="bg-white">
              <Download className="w-4 h-4 mr-2" />
              Descargar CSV
            </Button>
          </div>

          {/* Paso 2: Subir Archivo */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">Paso 2: Sube tu archivo CSV</p>
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
                file && 'border-emerald-400 bg-emerald-50'
              )}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
              ) : (
                <div className="text-gray-500">
                  <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Arrastra tu archivo CSV aquí o <span className="text-blue-600 font-medium">haz clic para buscar</span></p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={importMutation.isPending}>Cancelar</Button>
          <Button onClick={handleUpload} disabled={!file || importMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
            {importMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
            ) : (
              <><Upload className="w-4 h-4 mr-2" /> Importar Datos</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}