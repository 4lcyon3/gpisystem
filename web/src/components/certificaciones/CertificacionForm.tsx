/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { certificacionSchema, type CertificacionFormValues } from '@/types/certificacion';
import { useEntidades } from '@/hooks/useEntidades';
import { SearchableSelect, type SelectOption } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { FileCheck, Loader2, Building2, FileText } from 'lucide-react';

interface CertificacionFormProps {
  defaultValues?: Partial<CertificacionFormValues>;
  onSubmit: (data: CertificacionFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

interface DisponibilidadAprobada {
  id: string;
  numero_solicitud: string;
  monto_aprobado: number;
  entidad_id: string;
  anio_fiscal: number;
}

export function CertificacionForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Emitir Certificado',
}: CertificacionFormProps) {
  const currentYear = new Date().getFullYear();
  const [entidadId, setEntidadId] = useState(defaultValues?.entidad_id || '');

  const { data: entidades = [] } = useEntidades();

  const { data: disponibilidades = [] } = useQuery<DisponibilidadAprobada[]>({
    queryKey: ['disponibilidades-aprobadas', entidadId],
    queryFn: async () => {
      if (!entidadId) return [];
      const res = await api.get('/disponibilidad/', {
        params: { entidad_id: entidadId, estado: 'aprobado', limit: 100 },
      });
      return res.data.data || [];
    },
    staleTime: 30_000,
  });

  const { control, register, handleSubmit, formState: { errors }, reset, watch, setValue } =
    useForm<CertificacionFormValues>({
      resolver: zodResolver(certificacionSchema) as any,
      defaultValues: {
        anio_fiscal: currentYear,
        fecha_certificacion: new Date().toISOString().split('T')[0],
        monto_certificado: 0,
        numero_certificado: '',
        observaciones: '',
        ...defaultValues,
      },
    });

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  const disponibilidadId = watch('disponibilidad_id');
  const disponibilidadSeleccionada = disponibilidades.find(d => d.id === disponibilidadId);

  // Auto-completar monto y año al seleccionar disponibilidad
  useEffect(() => {
    if (disponibilidadSeleccionada) {
      setValue('monto_certificado', disponibilidadSeleccionada.monto_aprobado, { shouldValidate: true });
      setValue('anio_fiscal', disponibilidadSeleccionada.anio_fiscal, { shouldValidate: true });
    }
  }, [disponibilidadSeleccionada, setValue]);

  const handleEntidadChange = (value: string) => {
    setEntidadId(value);
    setValue('disponibilidad_id', '', { shouldValidate: false });
    setValue('monto_certificado', 0, { shouldValidate: false });
  };

  const handleFormSubmit = (values: CertificacionFormValues) => {
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

  const disponibilidadOptions: SelectOption[] = disponibilidades.map((d) => ({
    value: d.id,
    label: d.numero_solicitud,
    badge: `S/ ${d.monto_aprobado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
    keywords: [d.numero_solicitud],
    description: `Año ${d.anio_fiscal}`,
  }));

  const montoCertificado = watch('monto_certificado') || 0;
  const montoAprobado = disponibilidadSeleccionada?.monto_aprobado || 0;
  const excedeMonto = montoCertificado > montoAprobado;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      
      {/* SECCIÓN 1: IDENTIFICACIÓN */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-blue-100">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">1. Identificación del Certificado</h3>
            <p className="text-xs text-gray-500">Datos del Certificado de Crédito Presupuestario</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Entidad <span className="text-red-500">*</span></Label>
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
          <Label className="text-sm font-semibold text-gray-700">
            Disponibilidad Aprobada <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="disponibilidad_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={disponibilidadOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder={entidadId ? 'Seleccionar disponibilidad' : 'Primero seleccione una entidad'}
                searchPlaceholder="Buscar N° solicitud..."
                icon={<FileText className="w-4 h-4" />}
                clearable
                showCount
                disabled={!entidadId}
                maxHeight={300}
              />
            )}
          />
          {errors.disponibilidad_id && <p className="text-xs text-red-600">{errors.disponibilidad_id.message}</p>}
          {!entidadId && <p className="text-xs text-amber-600">Seleccione una entidad para ver disponibilidades aprobadas</p>}
          {entidadId && disponibilidades.length === 0 && <p className="text-xs text-gray-500">No hay disponibilidades aprobadas para esta entidad</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="numero_certificado">N° Certificado <span className="text-red-500">*</span></Label>
            <Input id="numero_certificado" {...register('numero_certificado')} placeholder="CCP-001-2026" className="h-12 font-mono" />
            {errors.numero_certificado && <p className="text-xs text-red-600">{errors.numero_certificado.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fecha_certificacion">Fecha <span className="text-red-500">*</span></Label>
            <Controller
              name="fecha_certificacion"
              control={control}
              render={({ field }) => (
                <Input id="fecha_certificacion" type="date" value={field.value || ''} onChange={field.onChange} className="h-12" />
              )}
            />
            {errors.fecha_certificacion && <p className="text-xs text-red-600">{errors.fecha_certificacion.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="anio_fiscal">Año Fiscal <span className="text-red-500">*</span></Label>
            <Input id="anio_fiscal" type="number" {...register('anio_fiscal', { valueAsNumber: true })} className="h-12 font-bold" />
            {errors.anio_fiscal && <p className="text-xs text-red-600">{errors.anio_fiscal.message}</p>}
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: MONTO */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-emerald-100">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">2. Monto a Certificar</h3>
            <p className="text-xs text-gray-500">El monto no puede exceder el aprobado en la disponibilidad</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 font-semibold uppercase">Monto Aprobado (Disp.)</p>
            <p className="text-xl font-bold text-blue-900 tabular-nums mt-1">
              S/ {montoAprobado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className={`p-4 rounded-lg border ${excedeMonto ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className={`text-xs font-semibold uppercase ${excedeMonto ? 'text-red-700' : 'text-emerald-700'}`}>
              Monto a Certificar
            </p>
            <p className={`text-xl font-bold tabular-nums mt-1 ${excedeMonto ? 'text-red-900' : 'text-emerald-900'}`}>
              S/ {montoCertificado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monto_certificado">Monto Certificado (S/) <span className="text-red-500">*</span></Label>
          <Input
            id="monto_certificado"
            type="number"
            step="0.01"
            {...register('monto_certificado', { valueAsNumber: true })}
            className={`h-12 text-lg font-bold tabular-nums ${excedeMonto ? 'border-red-500' : ''}`}
          />
          {errors.monto_certificado && <p className="text-xs text-red-600">{errors.monto_certificado.message}</p>}
          {excedeMonto && <p className="text-xs text-red-600 font-medium">⚠️ El monto excede el aprobado en la disponibilidad</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="observaciones">Observaciones</Label>
          <Textarea id="observaciones" {...register('observaciones')} placeholder="Notas adicionales sobre la certificación..." className="min-h-25" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="h-11 px-6">Cancelar</Button>
        <Button type="submit" disabled={isLoading || excedeMonto} className="bg-emerald-600 hover:bg-emerald-700 h-11 px-8 text-base font-semibold">
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Emitiendo...</> : <><FileCheck className="w-4 h-4 mr-2" /> {submitLabel}</>}
        </Button>
      </div>
    </form>
  );
}