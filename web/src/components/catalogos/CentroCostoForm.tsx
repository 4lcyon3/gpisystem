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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Building2, Loader2 } from 'lucide-react';
import { useEntidades } from '@/hooks/useEntidades';
import type { SelectOption } from '@/components/ui/searchable-select';

const schema = z.object({
  entidad_id: z.string().uuid('Seleccione una entidad'),
  codigo: z.string().min(1, 'El código es requerido').max(20),
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
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

export function CentroCostoForm({ open, onOpenChange, onSubmit, isLoading, defaultValues }: Props) {
  const { data: entidades = [] } = useEntidades();
  const isEditing = !!defaultValues?.entidad_id;

  const { control, register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { entidad_id: '', codigo: '', nombre: '', activo: true },
  });

  useEffect(() => {
    if (open) {
      reset({
        entidad_id: defaultValues?.entidad_id || '',
        codigo: defaultValues?.codigo || '',
        nombre: defaultValues?.nombre || '',
        activo: defaultValues?.activo ?? true,
      });
    }
  }, [open, defaultValues, reset]);


  const entidadOptions: SelectOption[] = entidades.map((e) => ({
    value: e.id,
    label: e.nombre,
    badge: e.ruc,
    keywords: [e.ruc, e.sector].filter(Boolean) as string[],
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            {isEditing ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifique los datos del centro de costo' : 'Registre un nuevo centro de costo'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Entidad <span className="text-red-500">*</span></Label>
            <Controller
              name="entidad_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  options={entidadOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Seleccionar entidad"
                  searchPlaceholder="Buscar..."
                  clearable
                  showCount
                  disabled={isEditing}
                />
              )}
            />
            {errors.entidad_id && <p className="text-xs text-red-600">{errors.entidad_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo">Código <span className="text-red-500">*</span></Label>
            <Input id="codigo" {...register('codigo')} placeholder="Ej: 001" className="h-11" />
            {errors.codigo && <p className="text-xs text-red-600">{errors.codigo.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
            <Input id="nombre" {...register('nombre')} placeholder="Ej: Dirección General" className="h-11" />
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
              Centro de costo activo
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