/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { presupuestoSchema, type PresupuestoFormValues } from '@/types/presupuesto';
import { useEntidades } from '@/hooks/useEntidades';
import { usePoiList } from '@/hooks/usePoi';
import { useCentrosCosto } from '@/hooks/useCentrosCosto';
import { useClasificadores } from '@/hooks/useDashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFuentesDatos } from '@/hooks/useFuentesDatos';
import { Database } from 'lucide-react';

import { Loader2, DollarSign, Building2, Hash, TrendingUp, Target } from 'lucide-react';
import { SearchableSelect, type SelectOption } from '../ui/searchable-select';

interface PresupuestoFormProps {
  defaultValues?: Partial<PresupuestoFormValues>;
  onSubmit: (data: PresupuestoFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function PresupuestoForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Guardar',
}: PresupuestoFormProps) {
  const currentYear = new Date().getFullYear();
  const [entidadId, setEntidadId] = useState(defaultValues?.entidad_id || '');

  const { data: entidades = [] } = useEntidades();
  const { data: poisData } = usePoiList({
    page: 1,
    limit: 100,
    entidad_id: entidadId,
  });
  const { data: centrosCosto = [] } = useCentrosCosto(entidadId);
  const { data: clasificadores = [] } = useClasificadores();

  const { control, register, handleSubmit, formState: { errors }, watch, setValue } = useForm<PresupuestoFormValues>({
    resolver: zodResolver(presupuestoSchema) as any,
    defaultValues: {
      anio_fiscal: currentYear,
      pia: 0,
      modificaciones_acumuladas: 0,
      meta_presupuestal: '',
      poi_id: '',
      fuente_datos_id: '', 
      ...defaultValues,
    },
  });
  const { data: fuentesDatos = [] } = useFuentesDatos();

  // Opciones enriquecidas para el selector
  const fuenteDatosOptions: SelectOption[] = fuentesDatos.map((f) => ({
    value: f.id,
    label: f.nombre,
    badge: f.tipo,
    keywords: [f.nombre, f.tipo].filter(Boolean) as string[],
    description: f.tipo ? `Tipo: ${f.tipo}` : undefined,
  }));

  const pia = watch('pia') || 0;
  const modificaciones = watch('modificaciones_acumuladas') || 0;
  const pimCalculado = pia + modificaciones;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const entidadOptions: SelectOption[] = entidades.map((e) => ({
    value: e.id,
    label: e.nombre,
    badge: e.ruc,
    keywords: [e.ruc, e.sector, e.nivel_gobierno].filter(Boolean) as string[],
    description: e.sector ? `Sector: ${e.sector}` : undefined,
  }));

  const poiOptions: SelectOption[] = (poisData?.data || []).map((poi) => ({
    value: poi.id,
    label: poi.nombre,
    badge: poi.codigo_actividad,
    keywords: [poi.codigo_actividad, poi.area_responsable].filter(Boolean) as string[],
    description: poi.area_responsable ? `Área: ${poi.area_responsable}` : undefined,
  }));

  const centroCostoOptions: SelectOption[] = centrosCosto.map((cc) => ({
    value: cc.id,
    label: cc.nombre,
    badge: cc.codigo,
    keywords: [cc.codigo].filter(Boolean) as string[],
  }));

  const clasificadorOptions: SelectOption[] = clasificadores.map((c) => ({
    value: c.id,
    label: c.descripcion,
    badge: c.codigo,
    keywords: [c.codigo, c.generica, c.descripcion].filter(Boolean) as string[],
    description: c.generica ? `Genérica: ${c.generica}` : undefined,
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
            <h3 className="text-base font-bold text-gray-900">
              1. Identificación del Presupuesto
            </h3>
            <p className="text-xs text-gray-500">
              Información general de la entidad y período fiscal
            </p>
          </div>
        </div>

        {/* Entidad con SearchableSelect */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Entidad Pública <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="entidad_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={entidadOptions}
                value={field.value || ''}
                onChange={(value) => {
                  field.onChange(value);
                  setEntidadId(value);
                  setValue('poi_id', '', { shouldValidate: false });
                  setValue('centro_costo_id', '', { shouldValidate: false });
                }}
                placeholder="Seleccionar entidad pública"
                searchPlaceholder="Buscar por nombre, RUC o sector..."
                icon={<Building2 className="w-4 h-4" />}
                clearable
                showCount
                disabled={!!defaultValues?.entidad_id}
              />
            )}
          />
          {!entidadId && (
            <p className="text-xs text-amber-600">
              Seleccione una entidad para habilitar los campos de POI y Centro de Costo
            </p>
          )}
          {errors.entidad_id && <p className="text-xs text-red-600">{errors.entidad_id.message}</p>}
        </div>

        {/* Grid de 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="anio_fiscal" className="text-sm font-semibold text-gray-700">
              Año Fiscal <span className="text-red-500">*</span>
            </Label>
            <Input
              id="anio_fiscal"
              type="number"
              {...register('anio_fiscal', { valueAsNumber: true })}
              placeholder="2026"
              className="h-12 text-base"
            />
            <p className="text-xs text-gray-500">Período presupuestal (ej: 2026)</p>
            {errors.anio_fiscal && <p className="text-xs text-red-600">{errors.anio_fiscal.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_presupuestal" className="text-sm font-semibold text-gray-700">
              Meta Presupuestal
            </Label>
            <Input
              id="meta_presupuestal"
              {...register('meta_presupuestal')}
              placeholder="Código de cadena presupuestal"
              className="h-12 text-base"
            />
            <p className="text-xs text-gray-500">Opcional - Código de seguimiento</p>
          </div>
        </div>

        {/* POI con SearchableSelect */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Actividad Operativa (POI)
            <span className="text-xs text-gray-500 font-normal ml-2">(Opcional)</span>
          </Label>
          <Controller
            name="poi_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={poiOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Seleccionar POI (opcional)"
                searchPlaceholder="Buscar por código o nombre..."
                icon={<Target className="w-4 h-4" />}
                clearable
                showCount
                disabled={!entidadId}
              />
            )}
          />
          <p className="text-xs text-gray-500">
            Vincule este presupuesto a una actividad operativa específica
          </p>
        </div>
      </div>
      {/* Fuente de Datos */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">
          Fuente de Datos <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="fuente_datos_id"
          control={control}
          render={({ field }) => (
            <SearchableSelect
              options={fuenteDatosOptions}
              value={field.value || ''}
              onChange={field.onChange}
              placeholder="Seleccionar fuente de datos"
              searchPlaceholder="Buscar por nombre o tipo..."
              icon={<Database className="w-4 h-4" />}
              clearable
              showCount
            />
          )}
        />
        <p className="text-xs text-gray-500">
          Sistema de origen de la información presupuestal (SIAF, SIGA, etc.)
        </p>
        {errors.fuente_datos_id && (
          <p className="text-xs text-red-600">{errors.fuente_datos_id.message}</p>
        )}
      </div>

      {/* SECCIÓN 2: CLASIFICACIÓN PRESUPUESTAL */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-100">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Hash className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              2. Clasificación Presupuestal
            </h3>
            <p className="text-xs text-gray-500">
              Estructura orgánica y económica del gasto
            </p>
          </div>
        </div>

        {/* Centro de Costo con SearchableSelect */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Centro de Costo <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="centro_costo_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={centroCostoOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Seleccionar centro de costo"
                searchPlaceholder="Buscar por código o nombre..."
                clearable
                showCount
                disabled={!entidadId}
              />
            )}
          />
          <p className="text-xs text-gray-500">
            Unidad orgánica responsable de la ejecución del gasto
          </p>
          {errors.centro_costo_id && <p className="text-xs text-red-600">{errors.centro_costo_id.message}</p>}
        </div>

        {/* Clasificador con SearchableSelect */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Clasificador de Gasto <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="clasificacion_gasto_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={clasificadorOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Seleccionar clasificador presupuestal"
                searchPlaceholder="Buscar por código o descripción..."
                clearable
                showCount
                maxHeight={400}
              />
            )}
          />
          <p className="text-xs text-gray-500">
            Categoría económica del gasto (bienes, servicios, personal, etc.)
          </p>
          {errors.clasificacion_gasto_id && <p className="text-xs text-red-600">{errors.clasificacion_gasto_id.message}</p>}
        </div>
      </div>

      {/* ============================================
          SECCIÓN 3: MONTOS PRESUPUESTALES
          ============================================ */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-emerald-100">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              3. Montos Presupuestales
            </h3>
            <p className="text-xs text-gray-500">
              Valores en Soles Peruanos (S/)
            </p>
          </div>
        </div>

        {/* PIA - VERTICAL */}
        <div className="space-y-2">
          <Label htmlFor="pia" className="text-sm font-semibold text-gray-700">
            PIA - Presupuesto Institucional de Apertura <span className="text-red-500">*</span>
          </Label>
          <Input
            id="pia"
            type="number"
            step="0.01"
            {...register('pia', { valueAsNumber: true })}
            placeholder="0.00"
            className="h-12 text-base font-semibold tabular-nums"
          />
          <p className="text-xs text-gray-500">
            Monto aprobado al inicio del año fiscal
          </p>
          {errors.pia && <p className="text-xs text-red-600">{errors.pia.message}</p>}
        </div>

        {/* Modificaciones - VERTICAL */}
        <div className="space-y-2">
          <Label htmlFor="modificaciones_acumuladas" className="text-sm font-semibold text-gray-700">
            Modificaciones Acumuladas
          </Label>
          <Input
            id="modificaciones_acumuladas"
            type="number"
            step="0.01"
            {...register('modificaciones_acumuladas', { valueAsNumber: true })}
            placeholder="0.00"
            className="h-12 text-base font-semibold tabular-nums"
          />
          <p className="text-xs text-gray-500">
            Suma de habilitaciones, anulaciones y transferencias
          </p>
          {errors.modificaciones_acumuladas && <p className="text-xs text-red-600">{errors.modificaciones_acumuladas.message}</p>}
        </div>

        {/* PIM Calculado - VERTICAL con diseño destacado */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            PIM - Presupuesto Institucional Modificado
            <span className="text-xs text-gray-500 font-normal ml-2">(Calculado automáticamente)</span>
          </Label>
          <div className="h-12 px-4 flex items-center justify-between bg-linear-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-md shadow-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Total PIM:</span>
            </div>
            <span className="font-bold text-xl text-blue-900 tabular-nums">
              {formatCurrency(pimCalculado)}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Fórmula: PIA + Modificaciones Acumuladas
          </p>
        </div>
      </div>

      {/* ============================================
          BOTONES DE ACCIÓN
          ============================================ */}
        <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          disabled={isLoading}
          className="h-11 px-6"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-base font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
              Guardando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}