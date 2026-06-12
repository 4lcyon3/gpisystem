/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { disponibilidadSchema, type DisponibilidadFormValues } from '@/types/disponibilidad';
import { useEntidades } from '@/hooks/useEntidades';
import { useCentrosCosto } from '@/hooks/useCentrosCosto';
import { usePoiList } from '@/hooks/usePoi';
import { useClasificadores } from '@/hooks/useDashboard';
import { useFuentesFinanciamiento, useMetasPresupuestales } from '@/hooks/useCatalogos';
import { SearchableSelect, type SelectOption } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Building2, Target, DollarSign } from 'lucide-react';

interface DisponibilidadFormProps {
  defaultValues?: Partial<DisponibilidadFormValues>;
  onSubmit: (data: DisponibilidadFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function DisponibilidadForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Guardar',
}: DisponibilidadFormProps) {
  const currentYear = new Date().getFullYear();
  const [entidadId, setEntidadId] = useState(defaultValues?.entidad_id || '');
  const [, setAnioFiscal] = useState(defaultValues?.anio_fiscal || currentYear);

  const { data: entidades = [] } = useEntidades();
  const { data: centrosCosto = [] } = useCentrosCosto(entidadId);
  const { data: poisData } = usePoiList({ page: 1, limit: 100, entidad_id: entidadId });
  const { data: clasificadores = [] } = useClasificadores();
  const { data: fuentes = [] } = useFuentesFinanciamiento();
  const { data: metas = [] } = useMetasPresupuestales(entidadId);

  const { control, register, handleSubmit, formState: { errors }, reset, setValue } =
    useForm<DisponibilidadFormValues>({
      resolver: zodResolver(disponibilidadSchema) as any,
      defaultValues: {
        anio_fiscal: currentYear,
        fecha_solicitud: new Date().toISOString().split('T')[0],
        ...defaultValues,
      },
    });

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  const handleEntidadChange = (value: string) => {
    setEntidadId(value);
    setValue('centro_costo_id', '', { shouldValidate: false });
    setValue('poi_id', '', { shouldValidate: false });
    setValue('meta_id', '', { shouldValidate: false });
  };

  // Opciones enriquecidas
  const entidadOptions: SelectOption[] = entidades.map((e) => ({
    value: e.id, label: e.nombre, badge: e.ruc,
    keywords: [e.ruc, e.sector].filter(Boolean) as string[],
    group: e.nivel_gobierno || 'Sin clasificar',
  }));

  const ccOptions: SelectOption[] = centrosCosto.map((cc) => ({
    value: cc.id, label: cc.nombre, badge: cc.codigo, keywords: [cc.codigo],
  }));

  const poiOptions: SelectOption[] = (poisData?.data || []).map((p) => ({
    value: p.id, label: p.nombre, badge: p.codigo_actividad,
    keywords: [p.codigo_actividad, p.area_responsable].filter(Boolean) as string[],
  }));

  const metaOptions: SelectOption[] = metas.map((m) => ({
    value: m.id, label: m.nombre, badge: m.codigo, keywords: [m.codigo],
  }));

  const clasificadorOptions: SelectOption[] = clasificadores.map((c) => ({
    value: c.id, label: c.descripcion, badge: c.codigo, keywords: [c.codigo, c.generica].filter(Boolean) as string[],
  }));

  const fuenteOptions: SelectOption[] = fuentes.map((f) => ({
    value: f.id, label: f.nombre, badge: f.codigo, keywords: [f.codigo, f.tipo_rubro].filter(Boolean) as string[],
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      
      {/* SECCIÓN 1: IDENTIFICACIÓN */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-100">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">1. Identificación del Requerimiento</h3>
            <p className="text-xs text-gray-500">Datos generales de la solicitud de saldo</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Entidad Pública <span className="text-red-500">*</span></Label>
          <Controller name="entidad_id" control={control} render={({ field }) => (
            <SearchableSelect options={entidadOptions} value={field.value || ''} onChange={(v) => { field.onChange(v); handleEntidadChange(v); }} placeholder="Seleccionar entidad" searchPlaceholder="Buscar..." icon={<Building2 className="w-4 h-4" />} clearable showCount />
          )} />
          {errors.entidad_id && <p className="text-xs text-red-600">{errors.entidad_id.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Centro de Costo <span className="text-red-500">*</span></Label>
            <Controller name="centro_costo_id" control={control} render={({ field }) => (
              <SearchableSelect options={ccOptions} value={field.value || ''} onChange={field.onChange} placeholder="Seleccionar centro" disabled={!entidadId} clearable showCount />
            )} />
            {errors.centro_costo_id && <p className="text-xs text-red-600">{errors.centro_costo_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="anio_fiscal" className="text-sm font-semibold text-gray-700">Año Fiscal <span className="text-red-500">*</span></Label>
            <Input id="anio_fiscal" type="number" {...register('anio_fiscal', { valueAsNumber: true, onChange: (e) => setAnioFiscal(parseInt(e.target.value)) })} className="h-12" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="numero_solicitud" className="text-sm font-semibold text-gray-700">N° de Solicitud <span className="text-red-500">*</span></Label>
            <Input id="numero_solicitud" {...register('numero_solicitud')} placeholder="Ej: SOL-001-2026" className="h-12" />
            {errors.numero_solicitud && <p className="text-xs text-red-600">{errors.numero_solicitud.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_solicitud" className="text-sm font-semibold text-gray-700">Fecha de Solicitud <span className="text-red-500">*</span></Label>
            <Controller name="fecha_solicitud" control={control} render={({ field }) => (
              <Input id="fecha_solicitud" type="date" value={field.value || ''} onChange={field.onChange} className="h-12" />
            )} />
            {errors.fecha_solicitud && <p className="text-xs text-red-600">{errors.fecha_solicitud.message}</p>}
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: VINCULACIÓN PRESUPUESTAL */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-100">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">2. Vinculación Presupuestal</h3>
            <p className="text-xs text-gray-500">Cadena presupuestal y clasificación del gasto</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Actividad Operativa (POI) <span className="text-red-500">*</span></Label>
            <Controller name="poi_id" control={control} render={({ field }) => (
              <SearchableSelect options={poiOptions} value={field.value || ''} onChange={field.onChange} placeholder="Seleccionar POI" disabled={!entidadId} clearable showCount maxHeight={300} />
            )} />
            {errors.poi_id && <p className="text-xs text-red-600">{errors.poi_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Meta Presupuestal <span className="text-xs text-gray-500 font-normal">(Opcional)</span></Label>
            <Controller name="meta_id" control={control} render={({ field }) => (
              <SearchableSelect options={metaOptions} value={field.value || ''} onChange={field.onChange} placeholder="Seleccionar meta" disabled={!entidadId} clearable showCount />
            )} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Clasificador de Gasto <span className="text-red-500">*</span></Label>
            <Controller name="clasificacion_id" control={control} render={({ field }) => (
              <SearchableSelect options={clasificadorOptions} value={field.value || ''} onChange={field.onChange} placeholder="Seleccionar clasificador" clearable showCount maxHeight={400} />
            )} />
            {errors.clasificacion_id && <p className="text-xs text-red-600">{errors.clasificacion_id.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Fuente de Financiamiento <span className="text-red-500">*</span></Label>
            <Controller name="fuente_id" control={control} render={({ field }) => (
              <SearchableSelect options={fuenteOptions} value={field.value || ''} onChange={field.onChange} placeholder="Seleccionar fuente" clearable showCount />
            )} />
            {errors.fuente_id && <p className="text-xs text-red-600">{errors.fuente_id.message}</p>}
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: MONTO Y JUSTIFICACIÓN */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-emerald-100">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">3. Monto y Justificación</h3>
            <p className="text-xs text-gray-500">Detalle financiero y sustento del requerimiento</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monto_solicitado" className="text-sm font-semibold text-gray-700">Monto Solicitado (S/) <span className="text-red-500">*</span></Label>
          <Input id="monto_solicitado" type="number" step="0.01" {...register('monto_solicitado', { valueAsNumber: true })} placeholder="0.00" className="h-12 text-lg font-bold tabular-nums" />
          {errors.monto_solicitado && <p className="text-xs text-red-600">{errors.monto_solicitado.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion" className="text-sm font-semibold text-gray-700">Descripción / Justificación</Label>
          <Textarea id="descripcion" {...register('descripcion')} placeholder="Detalle el motivo y sustento de la solicitud de disponibilidad..." className="min-h-30" />
        </div>
      </div>

      {/* BOTONES */}
      <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="h-11 px-6">Cancelar</Button>
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-base font-semibold">
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando</> : submitLabel}
        </Button>
      </div>
    </form>
  );
}