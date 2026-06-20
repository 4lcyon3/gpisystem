/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { programacionSchema, TIPOS_PROGRAMACION, type ProgramacionFormValues } from '@/types/programacion';
import { useEntidades } from '@/hooks/useEntidades';
import { SearchableSelect, type SelectOption } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Loader2, Building2, Plus, Trash2, DollarSign } from 'lucide-react';

interface Props {
  defaultValues?: Partial<ProgramacionFormValues>;
  onSubmit: (data: ProgramacionFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const TIPOS_LABELS: Record<string, string> = {
  proyecto: 'Proyecto de Inversión',
  actividad: 'Actividad Operativa',
  inversion: 'Inversión',
  servicio: 'Servicio',
};

export function ProgramacionForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Guardar',
}: Props) {
  const currentYear = new Date().getFullYear();
  const { data: entidades = [] } = useEntidades();

  const { control, register, handleSubmit, formState: { errors }, reset } =
    useForm<ProgramacionFormValues>({
      resolver: zodResolver(programacionSchema) as any,
      defaultValues: {
        anio_inicio: currentYear,
        anio_fin: currentYear + 2,
        estado: 'borrador',
        observaciones: '',
        detalles: [
          { anio_fiscal: currentYear, monto_programado: 0, meta_fisica: 0, unidad_medida: '' },
          { anio_fiscal: currentYear + 1, monto_programado: 0, meta_fisica: 0, unidad_medida: '' },
          { anio_fiscal: currentYear + 2, monto_programado: 0, meta_fisica: 0, unidad_medida: '' },
        ],
        ...defaultValues,
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'detalles',
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        anio_inicio: currentYear,
        anio_fin: currentYear + 2,
        estado: 'borrador',
        observaciones: '',
        detalles: [
          { anio_fiscal: currentYear, monto_programado: 0, meta_fisica: 0, unidad_medida: '' },
          { anio_fiscal: currentYear + 1, monto_programado: 0, meta_fisica: 0, unidad_medida: '' },
          { anio_fiscal: currentYear + 2, monto_programado: 0, meta_fisica: 0, unidad_medida: '' },
        ],
        ...defaultValues,
      });
    }
  }, [defaultValues, reset, currentYear]);

  const handleFormSubmit = (values: ProgramacionFormValues) => {
    const cleaned = { ...values };
    if (!cleaned.observaciones) delete (cleaned as any).observaciones;
    
    // Limpiar unidad_medida vacía en detalles
    cleaned.detalles = cleaned.detalles.map(d => {
      const detalle = { ...d };
      if (!detalle.unidad_medida) delete (detalle as any).unidad_medida;
      return detalle;
    });
    
    onSubmit(cleaned);
  };

  const entidadOptions: SelectOption[] = entidades.map((e) => ({
    value: e.id,
    label: e.nombre,
    badge: e.ruc,
    keywords: [e.ruc, e.sector].filter(Boolean) as string[],
  }));

  const agregarAnio = () => {
    const ultimoAnio = fields.length > 0 
      ? fields[fields.length - 1].anio_fiscal 
      : currentYear;
    
    append({
      anio_fiscal: ultimoAnio + 1,
      monto_programado: 0,
      meta_fisica: 0,
      unidad_medida: '',
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      
      {/* SECCIÓN 1: IDENTIFICACIÓN */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-100">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">1. Identificación de la Programación</h3>
            <p className="text-xs text-gray-500">Datos generales del proyecto o actividad</p>
          </div>
        </div>

        {/* Entidad - fila completa */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Entidad <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="entidad_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={entidadOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Seleccionar entidad"
                searchPlaceholder="Buscar..."
                icon={<Building2 className="w-4 h-4" />}
                clearable
                showCount
              />
            )}
          />
          {errors.entidad_id && <p className="text-xs text-red-600">{errors.entidad_id.message}</p>}
        </div>

        {/* Nombre - fila completa */}
        <div className="space-y-2">
          <Label htmlFor="nombre" className="text-sm font-semibold text-gray-700">
            Nombre del Proyecto/Actividad <span className="text-red-500">*</span>
          </Label>
          <Input
            id="nombre"
            {...register('nombre')}
            placeholder="Ej: Construcción Hospital Regional"
            className="h-12 text-base"
          />
          {errors.nombre && <p className="text-xs text-red-600">{errors.nombre.message}</p>}
        </div>

        {/* Tipo - fila completa */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Tipo <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="tipo"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PROGRAMACION.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPOS_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.tipo && <p className="text-xs text-red-600">{errors.tipo.message}</p>}
        </div>

        {/* Años - en par */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="anio_inicio" className="text-sm font-semibold text-gray-700">
              Año Inicio <span className="text-red-500">*</span>
            </Label>
            <Input
              id="anio_inicio"
              type="number"
              {...register('anio_inicio', { valueAsNumber: true })}
              className="h-12 font-bold text-base"
            />
            {errors.anio_inicio && <p className="text-xs text-red-600">{errors.anio_inicio.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="anio_fin" className="text-sm font-semibold text-gray-700">
              Año Fin <span className="text-red-500">*</span>
            </Label>
            <Input
              id="anio_fin"
              type="number"
              {...register('anio_fin', { valueAsNumber: true })}
              className="h-12 font-bold text-base"
            />
            {errors.anio_fin && <p className="text-xs text-red-600">{errors.anio_fin.message}</p>}
          </div>
        </div>

        {/* Observaciones - fila completa */}
        <div className="space-y-2">
          <Label htmlFor="observaciones" className="text-sm font-semibold text-gray-700">
            Observaciones
          </Label>
          <Textarea
            id="observaciones"
            {...register('observaciones')}
            placeholder="Notas adicionales sobre la programación..."
            className="min-h-25"
          />
        </div>
      </div>

      {/* SECCIÓN 2: PROGRAMACIÓN ANUAL */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b-2 border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">2. Programación Anual</h3>
              <p className="text-xs text-gray-500">Distribución de montos y metas por año fiscal</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={agregarAnio}
            disabled={fields.length >= 6}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar Año
          </Button>
        </div>

        {errors.detalles && !Array.isArray(errors.detalles) && (
          <p className="text-xs text-red-600 font-medium">{errors.detalles.message}</p>
        )}

        {/* Tarjetas de años en filas */}
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="relative p-5 bg-linear-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
            >
              {/* Header de la tarjeta */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Año {index + 1}</h4>
                </div>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                )}
              </div>

              {/* NUEVO GRID: 2 columnas en desktop, 1 en móvil */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Año Fiscal */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    Año Fiscal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    {...register(`detalles.${index}.anio_fiscal`, { valueAsNumber: true })}
                    className="h-11 font-bold text-base"
                  />
                  {errors.detalles?.[index]?.anio_fiscal && (
                    <p className="text-xs text-red-600">{errors.detalles[index].anio_fiscal.message}</p>
                  )}
                </div>

                {/* Monto Programado */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    Monto Programado (S/) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`detalles.${index}.monto_programado`, { valueAsNumber: true })}
                    className="h-11 font-semibold tabular-nums text-base"
                    placeholder="0.00"
                  />
                  {errors.detalles?.[index]?.monto_programado && (
                    <p className="text-xs text-red-600">{errors.detalles[index].monto_programado.message}</p>
                  )}
                </div>

                {/* Meta Física */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    Meta Física <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`detalles.${index}.meta_fisica`, { valueAsNumber: true })}
                    className="h-11 font-semibold tabular-nums text-base"
                    placeholder="0.00"
                  />
                  {errors.detalles?.[index]?.meta_fisica && (
                    <p className="text-xs text-red-600">{errors.detalles[index].meta_fisica.message}</p>
                  )}
                </div>

                {/* Unidad de Medida */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700">
                    Unidad de Medida
                  </Label>
                  <Input
                    {...register(`detalles.${index}.unidad_medida`)}
                    className="h-11 text-base"
                    placeholder="Ej: %, unidades, m²"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {fields.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">No hay años programados.</p>
            <p className="text-xs text-gray-400 mt-1">Haga clic en "Agregar Año" para comenzar.</p>
          </div>
        )}
      </div>

      {/* BOTONES */}
      <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="h-11 px-6">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-base font-semibold">
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : submitLabel}
        </Button>
      </div>
    </form>
  );
}