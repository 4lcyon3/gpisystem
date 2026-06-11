import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload } from 'lucide-react';
import { FileDropzone } from './FileDropzone';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: (cargaId: string) => void;
}

export function UploadDialog({
  open,
  onOpenChange,
  onUploadSuccess,
}: UploadDialogProps) {
  const handleUploadSuccess = (cargaId: string) => {
    onOpenChange(false); // Cerrar dialog de upload
    onUploadSuccess(cargaId); // Abrir dialog de progreso
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-blue-600" />
            </div>
            Nueva Importación de Datos
          </DialogTitle>
          <DialogDescription>
            Sube un archivo Excel o CSV para procesar información de ejecución
            presupuestal. El archivo se procesará en segundo plano.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <FileDropzone onUploadSuccess={handleUploadSuccess} />
        </div>

        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
          💡 Los archivos se procesan automáticamente y se eliminan tras la
          importación
        </div>
      </DialogContent>
    </Dialog>
  );
}