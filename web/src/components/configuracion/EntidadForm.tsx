/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { entidadSchema, type EntidadFormValues } from '@/types/entidad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface EntidadFormProps {
  defaultValues?: Partial<EntidadFormValues>;
  onSubmit: (data: EntidadFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const NIVELES_GOBIERNO = [
  { value: 'Nacional', label: 'Nacional' },
  { value: 'Regional', label: 'Regional' },
  { value: 'Local', label: 'Local' },
];

export function EntidadForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Guardar',
}: EntidadFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<EntidadFormValues>({
    resolver: zodResolver(entidadSchema) as any,
    defaultValues: { activo: true, ...defaultValues },
  });

  useEffect(() => {
    if (defaultValues) reset({ activo: true, ...defaultValues });
  }, [defaultValues, reset]);

  const activo = watch('activo');
  const nivelGobierno = watch('nivel_gobierno');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ruc">RUC <span className="text-red-500">*</span></Label>
          <Input
            id="ruc"
            {...register('ruc')}
            placeholder="20131380014"
            maxLength={11}
            disabled={!!defaultValues?.ruc}
          />
          {errors.ruc && <p className="text-xs text-red-600 mt-1">{errors.ruc.message}</p>}
        </div>

        <div>
          <Label htmlFor="nivel_gobierno">Nivel de Gobierno</Label>
          <Select
            value={nivelGobierno || ''}
            onValueChange={(v) => setValue('nivel_gobierno', v as any, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {NIVELES_GOBIERNO.map((n) => (
                <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="nombre">Nombre de la Entidad <span className="text-red-500">*</span></Label>
          <Input id="nombre" {...register('nombre')} placeholder="Ministerio de Salud - MINSA" />
          {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre.message}</p>}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="sector">Sector</Label>
          <Input id="sector" {...register('sector')} placeholder="Ej: Salud, Educación, Defensa" />
        </div>

        <div className="md:col-span-2 flex items-center space-x-2 pt-2">
          <Checkbox
            id="activo"
            checked={activo}
            onCheckedChange={(checked) => setValue('activo', checked as boolean)}
          />
          <Label htmlFor="activo" className="cursor-pointer">
            Entidad activa
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : submitLabel}
        </Button>
      </div>
    </form>
  );
}