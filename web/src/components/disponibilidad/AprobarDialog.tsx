/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Loader2 } from 'lucide-react';
import type { DisponibilidadEntity } from '@/types/disponibilidad';

const aprobarSchema = z.object({
  monto_aprobado: z.coerce.number().min(0, 'No puede ser negativo'),
  observaciones: z.string().optional().or(z.literal('')),
});

type AprobarValues = z.infer<typeof aprobarSchema>;

interface AprobarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disponibilidad: DisponibilidadEntity | null;
  onConfirm: (data: AprobarValues) => Promise<void>;
  isLoading: boolean;
}

export function AprobarDialog({ open, onOpenChange, disponibilidad, onConfirm, isLoading }: AprobarDialogProps) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AprobarValues>({
    resolver: zodResolver(aprobarSchema) as any,
    defaultValues: { monto_aprobado: disponibilidad?.monto_solicitado || 0 },
  });

  const onSubmit = async (data: AprobarValues) => {
    await onConfirm(data);
    reset();
  };

  if (!disponibilidad) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <CheckCircle className="w-5 h-5" /> Aprobar Disponibilidad
          </DialogTitle>
          <DialogDescription>
            Solicitud: <span className="font-bold">{disponibilidad.numero_solicitud}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <p className="text-gray-600">Monto Solicitado:</p>
            <p className="text-xl font-bold text-blue-900 tabular-nums">
              S/ {disponibilidad.monto_solicitado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Monto a Aprobar (S/) <span className="text-red-500">*</span></Label>
            <Input type="number" step="0.01" {...register('monto_aprobado')} className="h-11 font-bold" />
            {errors.monto_aprobado && <p className="text-xs text-red-600">{errors.monto_aprobado.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Observaciones</Label>
            <Textarea {...register('observaciones')} placeholder="Notas adicionales..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Confirmar Aprobación'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}