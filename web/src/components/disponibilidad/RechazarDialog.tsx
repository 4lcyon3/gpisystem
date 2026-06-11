import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { XCircle, Loader2 } from 'lucide-react';
import type { DisponibilidadEntity } from '@/types/disponibilidad';

const rechazarSchema = z.object({
  observaciones: z.string().min(10, 'Debe detallar el motivo del rechazo (mín. 10 caracteres)'),
});

type RechazarValues = z.infer<typeof rechazarSchema>;

interface RechazarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disponibilidad: DisponibilidadEntity | null;
  onConfirm: (data: RechazarValues) => Promise<void>;
  isLoading: boolean;
}

export function RechazarDialog({ open, onOpenChange, disponibilidad, onConfirm, isLoading }: RechazarDialogProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<RechazarValues>({
    resolver: zodResolver(rechazarSchema),
  });

  const onSubmit = async (data: RechazarValues) => {
    await onConfirm(data);
    reset();
  };

  if (!disponibilidad) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" /> Rechazar Disponibilidad
          </DialogTitle>
          <DialogDescription>
            Solicitud: <span className="font-bold">{disponibilidad.numero_solicitud}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Motivo del Rechazo <span className="text-red-500">*</span></Label>
            <Textarea {...register('observaciones')} placeholder="Explique detalladamente por qué se rechaza la solicitud..." className="min-h-25" />
            {errors.observaciones && <p className="text-xs text-red-600">{errors.observaciones.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Confirmar Rechazo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}