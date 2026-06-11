import { z } from 'zod';

export const TIPOS_MODIFICACION = [
  'Habilitacion',
  'Anulacion',
  'Credito Suplementario',
  'Transferencia',
] as const;

export const ESTADOS_MODIFICACION = ['aprobada', 'pendiente', 'anulada'] as const;

export type TipoModificacion = (typeof TIPOS_MODIFICACION)[number];
export type EstadoModificacion = (typeof ESTADOS_MODIFICACION)[number];

export const modificacionSchema = z.object({
  entidad_id: z.string().uuid('Debe seleccionar una entidad'),
  numero_resolucion: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  tipo_modificacion: z.string().min(1, 'Seleccione un tipo válido').refine((val) => TIPOS_MODIFICACION.includes(val as TipoModificacion), {
    message: 'Seleccione un tipo válido',
  }),
  fecha_aprobacion: z.string().min(1, 'La fecha es requerida'),
  monto_total: z.coerce
    .number()
    .min(0, 'Debe ser mayor o igual a 0'),
  descripcion: z.string().optional().or(z.literal('')),
  estado: z.enum(ESTADOS_MODIFICACION).default('aprobada'),
});

export type ModificacionFormValues = z.infer<typeof modificacionSchema>;

export interface ModificacionEntity {
  id: string;
  entidad_id: string;
  numero_resolucion: string;
  tipo_modificacion: TipoModificacion;
  fecha_aprobacion: string;
  monto_total: number;
  descripcion?: string;
  estado: EstadoModificacion;
  creado_en: string;
  actualizado_en?: string;
  entidad_nombre?: string;
}

export interface ModificacionPaginatedResponse {
  data: ModificacionEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ModificacionListParams {
  page: number;
  limit: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  entidad_id?: string;
  tipo_modificacion?: string;
  estado?: string;
  anio?: number;
}