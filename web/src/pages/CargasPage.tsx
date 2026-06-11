import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { UploadDialog } from '@/components/cargas/UploadDialog';
import { CargasStatsCards } from '@/components/cargas/CargasStatsCards';
import { HistorialCargasTable } from '@/components/cargas/HistorialCargasTable';
import { UploadProgressModal } from '@/components/cargas/UploadProgressModal';
import { ErroresCargaDialog } from '@/components/cargas/ErroresCargaDialog';
import { useCargas } from '@/hooks/useCargas';
import { useAuth } from '@/hooks/useAuth';

export function CargasPage() {
  const { canUpload } = useAuth();
  const { data: cargas, isLoading, refetch } = useCargas();

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [progressModal, setProgressModal] = useState<{
    open: boolean;
    cargaId: string | null;
  }>({ open: false, cargaId: null });
  const [errorsDialog, setErrorsDialog] = useState<{
    open: boolean;
    cargaId: string | null;
  }>({ open: false, cargaId: null });

  const handleUploadSuccess = (cargaId: string) => {
    // El UploadDialog ya se cerró, ahora abrimos el de progreso
    setProgressModal({ open: true, cargaId });
  };

  const handleViewProgress = (cargaId: string) => {
    setProgressModal({ open: true, cargaId });
  };

  const handleViewErrors = (cargaId: string) => {
    setErrorsDialog({ open: true, cargaId });
  };

  const handleProgressComplete = () => {
    refetch();
    setProgressModal({ open: false, cargaId: null });
  };

  return (
    <div className="p-6 lg:p-8 max-w-400 mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Importación de Datos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sube archivos Excel o CSV para procesar información de ejecución
            presupuestal
          </p>
        </div>
        {canUpload && (
          <Button
            onClick={() => setUploadDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Importación
          </Button>
        )}
      </div>

      {/* Stats */}
      <CargasStatsCards cargas={cargas} isLoading={isLoading} />

      {/* Historial */}
      <HistorialCargasTable
        cargas={cargas}
        isLoading={isLoading}
        onViewProgress={handleViewProgress}
        onViewErrors={handleViewErrors}
      />

      {/* Dialog de Upload (NUEVO) */}
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Modal de Progreso SSE */}
      <UploadProgressModal
        cargaId={progressModal.cargaId}
        open={progressModal.open}
        onOpenChange={(open) =>
          setProgressModal({ open, cargaId: open ? progressModal.cargaId : null })
        }
        onComplete={handleProgressComplete}
      />

      {/* Dialog de Errores */}
      <ErroresCargaDialog
        cargaId={errorsDialog.cargaId}
        open={errorsDialog.open}
        onOpenChange={(open) =>
          setErrorsDialog({ open, cargaId: open ? errorsDialog.cargaId : null })
        }
      />
    </div>
  );
}