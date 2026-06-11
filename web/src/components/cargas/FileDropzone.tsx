/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUploadArchivo } from '@/hooks/useCargas';

interface FileDropzoneProps {
  onUploadSuccess: (cargaId: string) => void;
}

const ACCEPTED_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export function FileDropzone({ onUploadSuccess }: FileDropzoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const uploadMutation = useUploadArchivo();

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setValidationError(null);

    if (rejected.length > 0) {
      const error = rejected[0].errors[0];
      if (error.code === 'file-invalid-type') {
        setValidationError('Solo se permiten archivos CSV o Excel (.xlsx, .xls)');
      } else if (error.code === 'file-too-large') {
        setValidationError(`El archivo es demasiado grande (máx ${MAX_SIZE_MB}MB)`);
      } else {
        setValidationError(error.message);
      }
      return;
    }

    if (accepted.length > 0) {
      setSelectedFile(accepted[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      const response = await uploadMutation.mutateAsync(selectedFile);
      onUploadSuccess(response.carga_id);
    } catch (error) {
      // El error ya se maneja en el mutation
      console.error("Error al subir el archivo:", error);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setValidationError(null);
  };

  return (
    <div className="space-y-3">
      {/* Dropzone area */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer',
          'hover:border-blue-400 hover:bg-blue-50/50',
          isDragActive && !isDragReject && 'border-blue-500 bg-blue-50',
          isDragReject && 'border-red-500 bg-red-50',
          !isDragActive && !selectedFile && 'border-gray-300 bg-gray-50/50',
          selectedFile && 'border-emerald-400 bg-emerald-50/30'
        )}
      >
        <input {...getInputProps()} />

        {!selectedFile ? (
          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors',
                isDragReject
                  ? 'bg-red-100'
                  : isDragActive
                  ? 'bg-blue-100'
                  : 'bg-gray-100'
              )}
            >
              <Upload
                className={cn(
                  'w-8 h-8',
                  isDragReject
                    ? 'text-red-600'
                    : isDragActive
                    ? 'text-blue-600'
                    : 'text-gray-400'
                )}
              />
            </div>
            <p className="text-base font-semibold text-gray-900 mb-1">
              {isDragReject
                ? 'Archivo no válido'
                : isDragActive
                ? 'Suelta el archivo aquí'
                : 'Arrastra y suelta tu archivo'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              o haz clic para seleccionar
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-1 bg-gray-100 rounded">.csv</span>
              <span className="px-2 py-1 bg-gray-100 rounded">.xlsx</span>
              <span className="px-2 py-1 bg-gray-100 rounded">.xls</span>
              <span className="text-gray-400">·</span>
              <span>Máx. {MAX_SIZE_MB}MB</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatBytes(selectedFile.size)} ·{' '}
                {selectedFile.type || 'archivo'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="h-8 w-8 text-gray-500 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Error de validación */}
      {validationError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{validationError}</p>
        </div>
      )}

      {/* Botón de upload */}
      {selectedFile && (
        <Button
          onClick={handleUpload}
          disabled={uploadMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 h-11"
        >
          {uploadMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Subiendo archivo...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Iniciar Importación
            </>
          )}
        </Button>
      )}
    </div>
  );
}