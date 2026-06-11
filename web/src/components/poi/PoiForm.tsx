/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { poiSchema, ESTADOS_POI, type PoiFormValues } from '@/types/poi';
import { useEntidades } from '@/hooks/useEntidades';
import { usePeiList } from '@/hooks/usePei';
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
import { Loader2, Building2, Target, DollarSign } from 'lucide-react';

interface PoiFormProps {
  defaultValues?: Partial<PoiFormValues> & { entidad_id?: string };
  onSubmit: (data: PoiFormValues & { entidad_id: string }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const ESTADOS_LABELS: Record<string, string> = {
  programada: 'Programada',
  en_ejecucion: 'En Ejecución',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

export function PoiForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Guardar',
}: PoiFormProps) {
  const [entidadId, setEntidadId] = useState(defaultValues?.entidad_id || '');

  const { data: entidades = [] } = useEntidades();
  
  // ✅ Hook con límite de 100 (evita error 422 del backend)
  const { data: peisData, isLoading: loadingPeis } = usePeiList({
    page: 1,
    limit: 100,
    entidad_id: entidadId,
  });

  const { control, register, handleSubmit, formState: { errors }, setValue } = useForm<PoiFormValues>({
    resolver: zodResolver(poiSchema) as any,
    mode: 'onTouched',
    defaultValues: {
      estado: 'programada',
      codigo_actividad: '',
      nombre: '',
      area_responsable: '',
      responsable_directo: '',
      unidad_medida: '',
      fuente_financiamiento_preliminar: '',
      pei_id: '',
      fecha_inicio: '',
      fecha_fin: '',
      meta_fisica_anual: undefined,
      presupuesto_estimado: undefined,
      ...defaultValues,
    },
  });

  const entidadOptions: SelectOption[] = entidades.map((e) => ({
    value: e.id,
    label: e.nombre,
    badge: e.ruc,
    keywords: [e.ruc, e.sector, e.nivel_gobierno].filter(Boolean) as string[],
    description: e.sector ? `Sector: ${e.sector}` : undefined,
    group: e.nivel_gobierno || 'Sin clasificar',
  }));

  const peiOptions: SelectOption[] = (peisData?.data || []).map((pei) => ({
    value: pei.id,
    label: pei.descripcion,
    badge: pei.codigo_objetivo,
    keywords: [pei.codigo_objetivo, pei.area_responsable, pei.accion_estrategica].filter(Boolean) as string[],
    description: pei.area_responsable ? `Área: ${pei.area_responsable}` : undefined,
    group: pei.estado === 'vigente' ? '✅ Vigentes' : '⚠️ Otros estados',
  }));

  const handleEntidadChange = (value: string) => {
    setEntidadId(value);
    setValue('pei_id', '', { shouldValidate: false });
  };

  const handleFormSubmit = (values: PoiFormValues) => {
    const cleaned = { ...values };
    const optionalFields = [
      'area_responsable', 'responsable_directo', 'unidad_medida',
      'fuente_financiamiento_preliminar',
    ] as const;

    optionalFields.forEach((field) => {
      if (cleaned[field] === '') delete cleaned[field];
    });

    if (cleaned.meta_fisica_anual === undefined || Number.isNaN(cleaned.meta_fisica_anual)) {
      delete cleaned.meta_fisica_anual;
    }
    if (cleaned.presupuesto_estimado === undefined || Number.isNaN(cleaned.presupuesto_estimado)) {
      delete cleaned.presupuesto_estimado;
    }

    onSubmit({ ...cleaned, entidad_id: entidadId });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      
      {/* SECCIÓN 1: IDENTIFICACIÓN */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-100">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">1. Identificación de la Actividad</h3>
            <p className="text-xs text-gray-500">Información general y vinculación estratégica</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Entidad Pública <span className="text-red-500">*</span>
          </Label>
          <SearchableSelect
            options={entidadOptions}
            value={entidadId}
            onChange={handleEntidadChange}
            placeholder="Seleccionar entidad pública"
            searchPlaceholder="Buscar por nombre, RUC o sector..."
            icon={<Building2 className="w-4 h-4" />}
            clearable
            showCount
            disabled={!!defaultValues?.entidad_id}
          />
          {!entidadId && (
            <p className="text-xs text-amber-600">Seleccione una entidad para ver los PEIs disponibles</p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Objetivo Estratégico (PEI) <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="pei_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={peiOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder={
                  !entidadId
                    ? 'Primero seleccione una entidad'
                    : loadingPeis
                    ? 'Cargando PEIs...'
                    : peiOptions.length === 0
                    ? 'No hay PEIs para esta entidad'
                    : 'Seleccionar objetivo estratégico'
                }
                searchPlaceholder="Buscar por código o descripción..."
                icon={<Target className="w-4 h-4" />}
                clearable
                showCount
                disabled={!entidadId || loadingPeis}
                maxHeight={400}
              />
            )}
          />
          <p className="text-xs text-gray-500">
            {entidadId
              ? `${peiOptions.length} objetivo(s) disponible(s) para esta entidad`
              : 'Vincule esta actividad a un objetivo estratégico'}
          </p>
          {errors.pei_id && <p className="text-xs text-red-600 font-medium">{errors.pei_id.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="codigo_actividad" className="text-sm font-semibold text-gray-700">
              Código de Actividad <span className="text-red-500">*</span>
            </Label>
            <Input id="codigo_actividad" {...register('codigo_actividad')} placeholder="Ej: AO.01.01" className="h-12 text-base" />
            {errors.codigo_actividad && <p className="text-xs text-red-600 font-medium">{errors.codigo_actividad.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Estado</Label>
            <Controller
              name="estado"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESTADOS_POI.map((e) => <SelectItem key={e} value={e}>{ESTADOS_LABELS[e]}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombre" className="text-sm font-semibold text-gray-700">
            Nombre de la Actividad <span className="text-red-500">*</span>
          </Label>
          <Textarea id="nombre" {...register('nombre')} placeholder="Descripción clara de la actividad..." className="min-h-25" />
          {errors.nombre && <p className="text-xs text-red-600 font-medium">{errors.nombre.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="area_responsable" className="text-sm font-semibold text-gray-700">Área Responsable</Label>
            <Input id="area_responsable" {...register('area_responsable')} placeholder="Ej: Oficina de Logística" className="h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsable_directo" className="text-sm font-semibold text-gray-700">Responsable Directo</Label>
            <Input id="responsable_directo" {...register('responsable_directo')} placeholder="Nombre del responsable" className="h-12" />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: METAS Y PRESUPUESTO */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-emerald-100">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">2. Metas y Presupuesto</h3>
            <p className="text-xs text-gray-500">Indicadores de desempeño y recursos asignados</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="unidad_medida" className="text-sm font-semibold text-gray-700">Unidad de Medida</Label>
            <Input id="unidad_medida" {...register('unidad_medida')} placeholder="Ej: Informes" className="h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta_fisica_anual" className="text-sm font-semibold text-gray-700">Meta Física Anual</Label>
            <Input id="meta_fisica_anual" type="number" step="0.01" {...register('meta_fisica_anual', { valueAsNumber: true })} placeholder="0" className="h-12 font-semibold tabular-nums" />
            {errors.meta_fisica_anual && <p className="text-xs text-red-600 font-medium">{errors.meta_fisica_anual.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="presupuesto_estimado" className="text-sm font-semibold text-gray-700">Presupuesto Estimado (S/)</Label>
            <Input id="presupuesto_estimado" type="number" step="0.01" {...register('presupuesto_estimado', { valueAsNumber: true })} placeholder="0.00" className="h-12 font-semibold tabular-nums" />
            {errors.presupuesto_estimado && <p className="text-xs text-red-600 font-medium">{errors.presupuesto_estimado.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuente_financiamiento_preliminar" className="text-sm font-semibold text-gray-700">Fuente de Financiamiento</Label>
            <Input id="fuente_financiamiento_preliminar" {...register('fuente_financiamiento_preliminar')} placeholder="Ej: Recursos Ordinarios" className="h-12" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fecha_inicio" className="text-sm font-semibold text-gray-700">
              Fecha de Inicio <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="fecha_inicio"
              control={control}
              render={({ field }) => (
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="h-12"
                />
              )}
            />
            {errors.fecha_inicio && <p className="text-xs text-red-600 font-medium">{errors.fecha_inicio.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fecha_fin" className="text-sm font-semibold text-gray-700">
              Fecha de Fin <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="fecha_fin"
              control={control}
              render={({ field }) => (
                <Input
                  id="fecha_fin"
                  type="date"
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="h-12"
                />
              )}
            />
            {errors.fecha_fin && <p className="text-xs text-red-600 font-medium">{errors.fecha_fin.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="h-11 px-6">Cancelar</Button>
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-base font-semibold">
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : submitLabel}
        </Button>
      </div>
    </form>
  );
}