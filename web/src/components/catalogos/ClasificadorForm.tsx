import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tags, Loader2 } from 'lucide-react';

const schema = z.object({
  codigo: z.string().min(1, 'El código es requerido').max(20),
  descripcion: z.string().min(1, 'La descripción es requerida').max(255),
  generica: z.string().optional().or(z.literal('')),
  subgenerica: z.string().optional().or(z.literal('')),
  especifica: z.string().optional().or(z.literal('')),
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

export function ClasificadorForm({ open, onOpenChange, onSubmit, isLoading, defaultValues }: Props) {
  const isEditing = !!defaultValues?.codigo;

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      codigo: '', descripcion: '', generica: '', subgenerica: '', especifica: '', activo: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        codigo: defaultValues?.codigo || '',
        descripcion: defaultValues?.descripcion || '',
        generica: defaultValues?.generica || '',
        subgenerica: defaultValues?.subgenerica || '',
        especifica: defaultValues?.especifica || '',
        activo: defaultValues?.activo ?? true,
      });
    }
  }, [open, defaultValues, reset]);

  const handleFormSubmit = (data: FormValues) => {
    const cleaned = { ...data };
    if (!cleaned.generica) delete cleaned.generica;
    if (!cleaned.subgenerica) delete cleaned.subgenerica;
    if (!cleaned.especifica) delete cleaned.especifica;
    onSubmit(cleaned);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-orange-600" />
            {isEditing ? 'Editar Clasificador de Gasto' : 'Nuevo Clasificador de Gasto'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifique los datos del clasificador' : 'Registre un nuevo clasificador presupuestal'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-1">
              <Label htmlFor="codigo">Código <span className="text-red-500">*</span></Label>
              <Input id="codigo" {...register('codigo')} placeholder="2.3.2.1.1" className="h-11 font-mono" disabled={isEditing} />
              {errors.codigo && <p className="text-xs text-red-600">{errors.codigo.message}</p>}
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="descripcion">Descripción <span className="text-red-500">*</span></Label>
              <Input id="descripcion" {...register('descripcion')} placeholder="Equipos médicos y hospitalarios" className="h-11" />
              {errors.descripcion && <p className="text-xs text-red-600">{errors.descripcion.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="generica">Genérica</Label>
              <Input id="generica" {...register('generica')} placeholder="Bienes y Servicios" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subgenerica">Subgenérica</Label>
              <Input id="subgenerica" {...register('subgenerica')} placeholder="Bienes" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="especifica">Específica</Label>
              <Input id="especifica" {...register('especifica')} placeholder="Equipos médicos" className="h-11" />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Controller
              name="activo"
              control={control}
              render={({ field }) => (
                <Checkbox id="activo" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="activo" className="cursor-pointer font-normal">
              Clasificador activo
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}