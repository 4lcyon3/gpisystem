/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { avanceSchema, MESES, type AvanceFormValues } from '@/types/avance';
import { useEntidades } from '@/hooks/useEntidades';
import { usePoiList } from '@/hooks/usePoi';
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
import { Activity, Loader2, Building2, Target, Calendar, TrendingUp } from 'lucide-react';

interface Props {
  defaultValues?: Partial<AvanceFormValues>;
  onSubmit: (data: AvanceFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function AvanceForm({ defaultValues, onSubmit, onCancel, isLoading, submitLabel = 'Registrar' }: Props) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [entidadId, setEntidadId] = useState(defaultValues?.entidad_id || '');

  const { data: entidades = [] } = useEntidades();
  const { data: poisData } = usePoiList({
    page: 1,
    limit: 100,
    entidad_id: entidadId,
  });

  const { control, register, handleSubmit, formState: { errors }, reset, watch, setValue } =
    useForm<AvanceFormValues>({
      resolver: zodResolver(avanceSchema) as any,
      defaultValues: {
        anio: currentYear,
        mes: currentMonth,
        meta_programada: 0,
        meta_ejecutada: 0,
        observaciones: '',
        ...defaultValues,
      },
    });

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  const metaProgramada = watch('meta_programada') || 0;
  const metaEjecutada = watch('meta_ejecutada') || 0;
  const porcentaje = metaProgramada > 0 ? (metaEjecutada / metaProgramada) * 100 : 0;

  const handleEntidadChange = (value: string) => {
    setEntidadId(value);
    setValue('poi_id', '', { shouldValidate: false });
  };

  const handleFormSubmit = (values: AvanceFormValues) => {
    const cleaned = { ...values };
    if (!cleaned.observaciones) delete (cleaned as any).observaciones;
    onSubmit(cleaned);
  };

  const entidadOptions: SelectOption[] = entidades.map((e) => ({
    value: e.id,
    label: e.nombre,
    badge: e.ruc,
    keywords: [e.ruc, e.sector].filter(Boolean) as string[],
  }));

  const poiOptions: SelectOption[] = (poisData?.data || []).map((p) => ({
    value: p.id,
    label: p.nombre,
    badge: p.codigo_actividad,
    keywords: [p.codigo_actividad, p.area_responsable].filter(Boolean) as string[],
    description: p.area_responsable ? `Área: ${p.area_responsable}` : undefined,
  }));

  const getBarColor = (pct: number) => {
    if (pct >= 100) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-blue-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      
      {/* SECCIÓN 1: IDENTIFICACIÓN */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-100">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">1. Identificación del Avance</h3>
            <p className="text-xs text-gray-500">Actividad operativa y período del avance</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Entidad <span className="text-red-500">*</span></Label>
          <Controller
            name="entidad_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={entidadOptions}
                value={field.value || ''}
                onChange={(v) => { field.onChange(v); handleEntidadChange(v); }}
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

        <div className="space-y-2">
          <Label>Actividad Operativa (POI) <span className="text-red-500">*</span></Label>
          <Controller
            name="poi_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={poiOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder={entidadId ? 'Seleccionar actividad' : 'Primero seleccione una entidad'}
                searchPlaceholder="Buscar..."
                icon={<Target className="w-4 h-4" />}
                clearable
                showCount
                disabled={!entidadId}
                maxHeight={300}
              />
            )}
          />
          {errors.poi_id && <p className="text-xs text-red-600">{errors.poi_id.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Mes <span className="text-red-500">*</span></Label>
            <Controller
              name="mes"
              control={control}
              render={({ field }) => (
                <Select value={String(field.value)} onValueChange={(v) => field.onChange(parseInt(v))}>
                  <SelectTrigger className="h-12">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.mes && <p className="text-xs text-red-600">{errors.mes.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="anio">Año <span className="text-red-500">*</span></Label>
            <Input
              id="anio"
              type="number"
              {...register('anio', { valueAsNumber: true })}
              className="h-12 font-bold"
            />
            {errors.anio && <p className="text-xs text-red-600">{errors.anio.message}</p>}
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: METAS */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-emerald-100">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">2. Metas Físicas</h3>
            <p className="text-xs text-gray-500">Programada vs ejecutada en el período</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="meta_programada">Meta Programada <span className="text-red-500">*</span></Label>
            <Input
              id="meta_programada"
              type="number"
              step="0.01"
              {...register('meta_programada', { valueAsNumber: true })}
              className="h-12 font-bold tabular-nums"
              placeholder="0.00"
            />
            {errors.meta_programada && <p className="text-xs text-red-600">{errors.meta_programada.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_ejecutada">Meta Ejecutada <span className="text-red-500">*</span></Label>
            <Input
              id="meta_ejecutada"
              type="number"
              step="0.01"
              {...register('meta_ejecutada', { valueAsNumber: true })}
              className="h-12 font-bold tabular-nums"
              placeholder="0.00"
            />
            {errors.meta_ejecutada && <p className="text-xs text-red-600">{errors.meta_ejecutada.message}</p>}
          </div>
        </div>

        {/* Barra de progreso visual */}
        <div className="p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Porcentaje de Avance</span>
            <span className={`text-lg font-bold tabular-nums ${
              porcentaje >= 100 ? 'text-emerald-600' :
              porcentaje >= 75 ? 'text-blue-600' :
              porcentaje >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {porcentaje.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getBarColor(porcentaje)}`}
              style={{ width: `${Math.min(porcentaje, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea
            id="observaciones"
            {...register('observaciones')}
            placeholder="Notas sobre el avance, dificultades, logros..."
            className="min-h-25"
          />
        </div>
      </div>

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