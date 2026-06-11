/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  modificacionSchema,
  TIPOS_MODIFICACION,
  ESTADOS_MODIFICACION,
  type ModificacionFormValues,
} from '@/types/modificacion';
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
import {
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowRightLeft,
} from 'lucide-react';

interface ModificacionFormProps {
  defaultValues?: Partial<ModificacionFormValues>;
  onSubmit: (data: ModificacionFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const TIPOS_CONFIG: Record<string, { label: string; icon: typeof TrendingUp; color: string }> = {
  Habilitacion: { label: 'Habilitación', icon: TrendingUp, color: 'text-emerald-600' },
  Anulacion: { label: 'Anulación', icon: TrendingDown, color: 'text-red-600' },
  'Credito Suplementario': { label: 'Crédito Suplementario', icon: DollarSign, color: 'text-blue-600' },
  Transferencia: { label: 'Transferencia', icon: ArrowRightLeft, color: 'text-purple-600' },
};

const ESTADOS_LABELS: Record<string, string> = {
  aprobada: 'Aprobada',
  pendiente: 'Pendiente',
  anulada: 'Anulada',
};

export function ModificacionForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Guardar',
}: ModificacionFormProps) {
  const { data: entidades = [] } = useEntidades();

  const { control, register, handleSubmit, formState: { errors }, reset, watch } =
    useForm<ModificacionFormValues>({
      resolver: zodResolver(modificacionSchema) as any,
      defaultValues: {
        estado: 'aprobada',
        monto_total: 0,
        numero_resolucion: '',
        descripcion: '',
        ...defaultValues,
      },
    });

  useEffect(() => {
    if (defaultValues) {
      reset({ estado: 'aprobada', monto_total: 0, numero_resolucion: '', descripcion: '', ...defaultValues });
    }
  }, [defaultValues, reset]);

  const tipoModificacion = watch('tipo_modificacion');
  const montoTotal = watch('monto_total') || 0;

  // Opciones enriquecidas
  const entidadOptions: SelectOption[] = entidades.map((e) => ({
    value: e.id,
    label: e.nombre,
    badge: e.ruc,
    keywords: [e.ruc, e.sector, e.nivel_gobierno].filter(Boolean) as string[],
    description: e.sector ? `Sector: ${e.sector}` : undefined,
    group: e.nivel_gobierno || 'Sin clasificar',
  }));

  const tipoOptions: SelectOption[] = TIPOS_MODIFICACION.map((t) => {
    const config = TIPOS_CONFIG[t];
    const Icon = config.icon;
    return {
      value: t,
      label: config.label,
      icon: <Icon className={`w-4 h-4 ${config.color}`} />,
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      
      {/* SECCIÓN 1: IDENTIFICACIÓN */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-100">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              1. Identificación de la Modificación
            </h3>
            <p className="text-xs text-gray-500">
              Datos del documento que sustenta la modificación presupuestaria
            </p>
          </div>
        </div>

        {/* Entidad */}
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
                onChange={field.onChange}
                placeholder="Seleccionar entidad pública"
                searchPlaceholder="Buscar por nombre, RUC o sector..."
                icon={<Building2 className="w-4 h-4" />}
                clearable
                showCount
              />
            )}
          />
          {errors.entidad_id && <p className="text-xs text-red-600">{errors.entidad_id.message}</p>}
        </div>

        {/* Grid: Resolución + Fecha + Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="numero_resolucion" className="text-sm font-semibold text-gray-700">
              N° de Resolución <span className="text-red-500">*</span>
            </Label>
            <Input
              id="numero_resolucion"
              {...register('numero_resolucion')}
              placeholder="Ej: R.D. 001-2026"
              className="h-12 text-base"
            />
            {errors.numero_resolucion && (
              <p className="text-xs text-red-600">{errors.numero_resolucion.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_aprobacion" className="text-sm font-semibold text-gray-700">
              Fecha de Aprobación <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="fecha_aprobacion"
              control={control}
              render={({ field }) => (
                <Input
                  id="fecha_aprobacion"
                  type="date"
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="h-12"
                />
              )}
            />
            {errors.fecha_aprobacion && (
              <p className="text-xs text-red-600">{errors.fecha_aprobacion.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Tipo de Modificación <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="tipo_modificacion"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  options={tipoOptions}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Seleccionar tipo"
                  searchPlaceholder="Buscar tipo..."
                  clearable={false}
                />
              )}
            />
            {errors.tipo_modificacion && (
              <p className="text-xs text-red-600">{errors.tipo_modificacion.message}</p>
            )}
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">
            Estado
          </Label>
          <Controller
            name="estado"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_MODIFICACION.map((e) => (
                    <SelectItem key={e} value={e}>
                      {ESTADOS_LABELS[e]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* SECCIÓN 2: IMPACTO ECONÓMICO */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-emerald-100">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              2. Impacto Económico
            </h3>
            <p className="text-xs text-gray-500">
              Monto de la modificación presupuestaria
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="monto_total" className="text-sm font-semibold text-gray-700">
              Monto Total (S/) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="monto_total"
              type="number"
              step="0.01"
              {...register('monto_total', { valueAsNumber: true })}
              placeholder="0.00"
              className="h-12 text-lg font-bold tabular-nums"
            />
            {errors.monto_total && (
              <p className="text-xs text-red-600">{errors.monto_total.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Vista Previa
            </Label>
            <div className="h-12 px-4 flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-md">
              <span className="font-bold text-lg text-blue-900 tabular-nums">
                {formatCurrency(montoTotal)}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {tipoModificacion && TIPOS_CONFIG[tipoModificacion]
                ? `Tipo: ${TIPOS_CONFIG[tipoModificacion].label}`
                : 'Seleccione un tipo de modificación'}
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: DESCRIPCIÓN */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-amber-100">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              3. Descripción y Justificación
            </h3>
            <p className="text-xs text-gray-500">
              Detalle del motivo de la modificación
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion" className="text-sm font-semibold text-gray-700">
            Descripción
          </Label>
          <Textarea
            id="descripcion"
            {...register('descripcion')}
            placeholder="Describa el motivo y sustento de la modificación presupuestaria..."
            className="min-h-[120px]"
          />
          <p className="text-xs text-gray-500">
            Opcional - Justificación detallada de la modificación
          </p>
        </div>
      </div>

      {/* BOTONES */}
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
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
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