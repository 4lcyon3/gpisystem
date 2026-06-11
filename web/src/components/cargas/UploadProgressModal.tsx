/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  FileSpreadsheet,
  PartyPopper,
} from 'lucide-react';
import { useSSE } from '@/hooks/useSSE';
import { useCargaDetalle, type CargaProgress } from '@/hooks/useCargas';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UploadProgressModalProps {
  cargaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const statusMessages: Record<string, string> = {
  pendiente: 'En cola de procesamiento...',
  procesando: 'Procesando archivo...',
  procesado: '¡Importación completada!',
  error: 'Ocurrió un error durante el procesamiento',
};

export function UploadProgressModal({
  cargaId,
  open,
  onOpenChange,
  onComplete,
}: UploadProgressModalProps) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<CargaProgress | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  
  const { data: cargaDetalle } = useCargaDetalle(
    open ? cargaId : null
  );

  // Inicializar con datos del detalle (solo una vez al abrir)
  useEffect(() => {
    if (cargaDetalle && !progress) {
      setProgress({
        carga_id: cargaDetalle.id,
        estado: cargaDetalle.estado,
        filas_total: cargaDetalle.filas_total,
        filas_ok: cargaDetalle.filas_ok,
        filas_error: cargaDetalle.filas_error,
        progreso:
          cargaDetalle.filas_total > 0
            ? Math.round(
                (cargaDetalle.filas_ok / cargaDetalle.filas_total) * 100
              )
            : 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargaDetalle]);

  // Resetear estado cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      setProgress(null);
      setHasCompleted(false);
    }
  }, [open]);
  
  // Callback estable usando useCallback implícito via función nombrada
  const handleSSEMessage = (data: CargaProgress) => {
    console.log('[SSE] Mensaje recibido:', data);
    setProgress(data);

    // Auto-cerrar SOLO UNA VEZ cuando termina
    if ((data.estado === 'procesado' || data.estado === 'error') && !hasCompleted) {
      setHasCompleted(true);

      // Invalidar queries de cargas
      queryClient.invalidateQueries({ queryKey: ['cargas'] });
      queryClient.invalidateQueries({ queryKey: ['carga', cargaId] });

      // Invalidar queries del dashboard para auto-refresh
      if (data.estado === 'procesado') {
        console.log('[SSE] Carga exitosa - invalidando queries del dashboard');
        queryClient.invalidateQueries({ queryKey: ['kpis'] });
        queryClient.invalidateQueries({ queryKey: ['evolucion-mensual'] });
        queryClient.invalidateQueries({ queryKey: ['ranking-entidades'] });
        queryClient.invalidateQueries({ queryKey: ['alertas'] });

        // Mostrar notificación de éxito
        toast.success('¡Datos importados exitosamente!', {
          description: 'El dashboard se ha actualizado con los nuevos datos'
        });
      } else {
        // Si hubo errores, mostrar notificación diferente
        toast.error('Importación completada con errores', {
          description: `${data.filas_error} filas no pudieron ser procesadas`
        });
      }
    }
  };

  // Suscribirse al SSE (solo cuando open=true y hay cargaId)
  useSSE<CargaProgress>({
    url: cargaId && open ? `/cargas/${cargaId}/stream` : '',
    enabled: !!cargaId && open && !hasCompleted, // ✅ Desactivar SSE cuando ya completó
    onMessage: handleSSEMessage,
  });

  const estado = progress?.estado || cargaDetalle?.estado || 'pendiente';
  const progreso = progress?.progreso ?? 0;
  const filasTotal = progress?.filas_total ?? cargaDetalle?.filas_total ?? 0;
  const filasOk = progress?.filas_ok ?? cargaDetalle?.filas_ok ?? 0;
  const filasError = progress?.filas_error ?? cargaDetalle?.filas_error ?? 0;

  const isProcessing = estado === 'pendiente' || estado === 'procesando';
  const isSuccess = estado === 'procesado';
  const isError = estado === 'error';

  const handleClose = () => {
    onOpenChange(false);
    onComplete();
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // Permitir cerrar manualmente solo si NO está procesando
        if (!isProcessing || !newOpen) {
          handleClose();
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (isProcessing) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isProcessing) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isProcessing && (
              <>
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                Procesando Importación
              </>
            )}
            {isSuccess && (
              <>
                <PartyPopper className="w-5 h-5 text-emerald-600" />
                ¡Importación Exitosa!
              </>
            )}
            {isError && (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                Error en la Importación
              </>
            )}
          </DialogTitle>
          <DialogDescription>{statusMessages[estado]}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex justify-center py-2">
            {isProcessing && (
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            )}
            {isSuccess && (
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
            )}
            {isError && (
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Progreso</span>
              <span className="font-bold text-gray-900 tabular-nums">
                {progreso}%
              </span>
            </div>
            <Progress
              value={progreso}
              className={cn(
                'h-2',
                isSuccess && '[&>div]:bg-emerald-500',
                isError && '[&>div]:bg-red-500'
              )}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-gray-500" />
                <p className="text-xs font-medium text-gray-500">Total</p>
              </div>
              <p className="text-lg font-bold text-gray-900 tabular-nums">
                {filasTotal.toLocaleString('es-PE')}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-xs font-medium text-emerald-700">Exitosas</p>
              </div>
              <p className="text-lg font-bold text-emerald-700 tabular-nums">
                {filasOk.toLocaleString('es-PE')}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <XCircle className="w-3.5 h-3.5 text-red-600" />
                <p className="text-xs font-medium text-red-700">Errores</p>
              </div>
              <p className="text-lg font-bold text-red-700 tabular-nums">
                {filasError.toLocaleString('es-PE')}
              </p>
            </div>
          </div>

          {isProcessing && (
            <p className="text-xs text-gray-500 text-center">
              Por favor no cierres esta ventana mientras se procesa el archivo.
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {isProcessing ? (
            <Button variant="outline" className="w-full" disabled>
              Procesando...
            </Button>
          ) : (
            <Button
              onClick={handleClose}
              className={cn(
                'w-full',
                isSuccess && 'bg-emerald-600 hover:bg-emerald-700',
                isError && 'bg-red-600 hover:bg-red-700'
              )}
            >
              {isSuccess ? 'Ver Resultados' : isError ? 'Ver Errores' : 'Cerrar'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}