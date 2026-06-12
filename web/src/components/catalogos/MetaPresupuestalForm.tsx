/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Target, Loader2 } from 'lucide-react';
import { useEntidades } from '@/hooks/useEntidades';
import type { SelectOption } from '@/components/ui/searchable-select';

const currentYear = new Date().getFullYear();

const schema = z.object({
  entidad_id: z.string().uuid('Seleccione una entidad'),
  codigo: z.string().min(1, 'El código es requerido').max(20),
  nombre: z.string().min(1, 'El nombre es requerido').max(255),
  anio_fiscal: z.coerce.number().min(2000, 'Año mínimo: 2000').max(2100, 'Año máximo: 2100'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormValues) => Promise<void>;
  isLoading: boolean;
  defaultValues?: Partial<FormValues>;
}

export function MetaPresupuestalForm({ open, onOpenChange, onSubmit, isLoading, defaultValues }: Props) {
  const { data: entidades = [] } = useEntidades();
  const isEditing = !!defaultValues?.entidad_id;

  const { control, register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      entidad_id: '',
      codigo: '',
      nombre: '',
      anio_fiscal: currentYear,
    },
  });

  // Resetear el formulario cada vez que se abre el dialog
  useEffect(() => {
    if (open) {
      reset({
        entidad_id: defaultValues?.entidad_id || '',
        codigo: defaultValues?.codigo || '',
        nombre: defaultValues?.nombre || '',
        anio_fiscal: defaultValues?.anio_fiscal || currentYear,
      });
    }
  }, [open, defaultValues, reset]);

  const entidadOptions: SelectOption[] = entidades.map((e) => ({
    value: e.id,
    label: e.nombre,
    badge: e.ruc,
    keywords: [e.ruc, e.sector].filter(Boolean) as string[],
    description: e.sector ? `Sector: ${e.sector}` : undefined,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            {isEditing ? 'Editar Meta Presupuestal' : 'Nueva Meta Presupuestal'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifique los datos de la meta presupuestal'
              : 'Registre una nueva meta en la cadena presupuestal'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Entidad */}
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
                  searchPlaceholder="Buscar por nombre o RUC..."
                  clearable
                  showCount
                  disabled={isEditing}
                />
              )}
            />
            {errors.entidad_id && <p className="text-xs text-red-600">{errors.entidad_id.message}</p>}
            {isEditing && (
              <p className="text-xs text-amber-600">
                La entidad no se puede modificar en edición
              </p>
            )}
          </div>

          {/* Grid: Código + Año Fiscal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código <span className="text-red-500">*</span></Label>
              <Input
                id="codigo"
                {...register('codigo')}
                placeholder="Ej: 00001"
                className="h-11 font-mono"
              />
              {errors.codigo && <p className="text-xs text-red-600">{errors.codigo.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="anio_fiscal">Año Fiscal <span className="text-red-500">*</span></Label>
              <Input
                id="anio_fiscal"
                type="number"
                {...register('anio_fiscal', { valueAsNumber: true })}
                className="h-11 font-bold"
              />
              {errors.anio_fiscal && <p className="text-xs text-red-600">{errors.anio_fiscal.message}</p>}
            </div>
          </div>

          {/* Nombre de la Meta */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Meta <span className="text-red-500">*</span></Label>
            <Input
              id="nombre"
              {...register('nombre')}
              placeholder="Ej: Atención de salud a la población"
              className="h-11"
            />
            {errors.nombre && <p className="text-xs text-red-600">{errors.nombre.message}</p>}
            <p className="text-xs text-gray-500">
              Descripción clara de la meta presupuestal
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                </>
              ) : isEditing ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}