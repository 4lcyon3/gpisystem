/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { peiSchema, type PeiFormValues } from '@/types/pei';
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
import { Loader2, Building2, FileText } from 'lucide-react';

interface PeiFormProps {
  defaultValues?: Partial<PeiFormValues>;
  onSubmit: (data: PeiFormValues) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const ESTADOS_PEI = [
  { value: 'vigente', label: 'Vigente' },
  { value: 'modificado', label: 'Modificado' },
  { value: 'archivado', label: 'Archivado' },
];

export function PeiForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Guardar',
}: PeiFormProps) {
  const { data: entidades = [] } = useEntidades();

  const { control, register, handleSubmit, formState: { errors }, reset } = useForm<PeiFormValues>({
    resolver: zodResolver(peiSchema) as any,
    mode: 'onTouched',
    defaultValues: {
      estado: 'vigente',
      codigo_objetivo: '',
      descripcion: '',
      accion_estrategica: '',
      indicador: '',
      linea_base: '',
      meta_anual: '',
      unidad_medida: '',
      area_responsable: '',
      vigencia_inicio: '',
      vigencia_fin: '',
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) reset({ estado: 'vigente', ...defaultValues });
  }, [defaultValues, reset]);


  const entidadOptions: SelectOption[] = entidades.map((e) => ({
    value: e.id,
    label: e.nombre,
    badge: e.ruc,
    keywords: [e.ruc, e.sector, e.nivel_gobierno].filter(Boolean) as string[],
    description: e.sector ? `Sector: ${e.sector}` : undefined,
    group: e.nivel_gobierno || 'Sin clasificar',
  }));

  const handleFormSubmit = (values: PeiFormValues) => {
    // Limpiar strings vacíos de campos opcionales
    const cleaned = { ...values };
    const optionalFields = [
      'accion_estrategica', 'indicador', 'linea_base',
      'meta_anual', 'unidad_medida', 'area_responsable',
    ] as const;

    optionalFields.forEach((field) => {
      if (cleaned[field] === '') {
        delete cleaned[field];
      }
    });

    onSubmit(cleaned);
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
            <h3 className="text-base font-bold text-gray-900">1. Identificación del Objetivo</h3>
            <p className="text-xs text-gray-500">Información general de la entidad y período de vigencia</p>
          </div>
        </div>

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
          <p className="text-xs text-gray-500">Entidad a la que pertenece este objetivo estratégico</p>
          {errors.entidad_id && <p className="text-xs text-red-600 font-medium">{errors.entidad_id.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="codigo_objetivo" className="text-sm font-semibold text-gray-700">
              Código del Objetivo <span className="text-red-500">*</span>
            </Label>
            <Input id="codigo_objetivo" {...register('codigo_objetivo')} placeholder="Ej: OE.01" className="h-12 text-base" />
            {errors.codigo_objetivo && <p className="text-xs text-red-600 font-medium">{errors.codigo_objetivo.message}</p>}
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
                    {ESTADOS_PEI.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="vigencia_inicio" className="text-sm font-semibold text-gray-700">
              Fecha de Inicio <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="vigencia_inicio"
              control={control}
              render={({ field }) => (
                <Input
                  id="vigencia_inicio"
                  type="date"
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="h-12"
                />
              )}
            />
            {errors.vigencia_inicio && <p className="text-xs text-red-600 font-medium">{errors.vigencia_inicio.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vigencia_fin" className="text-sm font-semibold text-gray-700">
              Fecha de Fin <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="vigencia_fin"
              control={control}
              render={({ field }) => (
                <Input
                  id="vigencia_fin"
                  type="date"
                  value={field.value || ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  className="h-12"
                />
              )}
            />
            {errors.vigencia_fin && <p className="text-xs text-red-600 font-medium">{errors.vigencia_fin.message}</p>}
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: DESCRIPCIÓN Y METAS */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-purple-100">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">2. Descripción y Metas</h3>
            <p className="text-xs text-gray-500">Detalle del objetivo estratégico y sus indicadores</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion" className="text-sm font-semibold text-gray-700">
            Descripción del Objetivo <span className="text-red-500">*</span>
          </Label>
          <Textarea id="descripcion" {...register('descripcion')} placeholder="Describa el objetivo estratégico..." className="min-h-30" />
          {errors.descripcion && <p className="text-xs text-red-600 font-medium">{errors.descripcion.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="accion_estrategica" className="text-sm font-semibold text-gray-700">Acción Estratégica</Label>
          <Textarea id="accion_estrategica" {...register('accion_estrategica')} placeholder="Acción estratégica asociada..." className="min-h-25" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="indicador" className="text-sm font-semibold text-gray-700">Indicador</Label>
            <Input id="indicador" {...register('indicador')} placeholder="Ej: Porcentaje de cumplimiento" className="h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unidad_medida" className="text-sm font-semibold text-gray-700">Unidad de Medida</Label>
            <Input id="unidad_medida" {...register('unidad_medida')} placeholder="Ej: Porcentaje" className="h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linea_base" className="text-sm font-semibold text-gray-700">Línea Base</Label>
            <Input id="linea_base" {...register('linea_base')} placeholder="Ej: 60%" className="h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta_anual" className="text-sm font-semibold text-gray-700">Meta Anual</Label>
            <Input id="meta_anual" {...register('meta_anual')} placeholder="Ej: 80%" className="h-12" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="area_responsable" className="text-sm font-semibold text-gray-700">Área Responsable</Label>
          <Input id="area_responsable" {...register('area_responsable')} placeholder="Ej: Dirección de Planificación" className="h-12" />
        </div>
      </div>

      {/* BOTONES */}
      <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="h-11 px-6">
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-base font-semibold">
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : submitLabel}
        </Button>
      </div>
    </form>
  );
}