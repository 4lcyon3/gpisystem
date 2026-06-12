/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Loader2 } from 'lucide-react';

const schema = z.object({
  codigo: z.string().min(1, 'El código es requerido').max(10, 'Máximo 10 caracteres'),
  nombre: z.string().min(1, 'El nombre es requerido').max(150, 'Máximo 150 caracteres'),
  tipo_rubro: z.string().max(50).optional().or(z.literal('')),
  activo: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues) => Promise<void>;
  isLoading: boolean;
  defaultValues?: Partial<FormValues>;
}

const TIPOS_RUBRO = [
  { value: 'RO', label: 'Recursos Ordinarios' },
  { value: 'RDR', label: 'Recursos Directamente Recaudados' },
  { value: 'ROOC', label: 'Recursos por Operaciones Oficiales de Crédito' },
  { value: 'DT', label: 'Donaciones y Transferencias' },
  { value: 'RD', label: 'Recursos Determinados' },
  { value: 'RE', label: 'Recursos de Endeudamiento' },
  { value: 'IM', label: 'Impuestos Municipales' },
  { value: 'AC', label: 'Aportes y Contribuciones' },
];

export function FuenteFinanciamientoForm({ open, onOpenChange, onSubmit, isLoading, defaultValues }: Props) {
  const isEditing = !!defaultValues?.codigo;

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { codigo: '', nombre: '', tipo_rubro: '', activo: true },
  });

  useEffect(() => {
    if (open) {
      reset({
        codigo: defaultValues?.codigo || '',
        nombre: defaultValues?.nombre || '',
        tipo_rubro: defaultValues?.tipo_rubro || '',
        activo: defaultValues?.activo ?? true,
      });
    }
  }, [open, defaultValues, reset]);

  const handleFormSubmit = (data: FormValues) => {
    const cleaned = { ...data };
    if (!cleaned.tipo_rubro) delete cleaned.tipo_rubro;
    onSubmit(cleaned);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            {isEditing ? 'Editar Fuente de Financiamiento' : 'Nueva Fuente de Financiamiento'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifique los datos de la fuente' : 'Registre una nueva fuente de financiamiento'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código <span className="text-red-500">*</span></Label>
              <Input
                id="codigo"
                {...register('codigo')}
                placeholder="Ej: 1"
                className="h-11 font-mono font-bold"
                disabled={isEditing}
              />
              {errors.codigo && <p className="text-xs text-red-600">{errors.codigo.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_rubro">Tipo de Rubro</Label>
              <select
                id="tipo_rubro"
                {...register('tipo_rubro')}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sin especificar</option>
                {TIPOS_RUBRO.map((tr) => (
                  <option key={tr.value} value={tr.value}>
                    {tr.value} - {tr.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
            <Input
              id="nombre"
              {...register('nombre')}
              placeholder="Ej: Recursos Ordinarios"
              className="h-11"
            />
            {errors.nombre && <p className="text-xs text-red-600">{errors.nombre.message}</p>}
          </div>

          {/* Checkbox de Activo */}
          <div className="flex items-center space-x-2 pt-2">
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="activo"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="activo" className="cursor-pointer font-normal">
              Fuente de financiamiento activa
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
              ) : isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}