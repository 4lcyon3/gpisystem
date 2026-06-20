import { z } from 'zod';

export const TIPOS_PROGRAMACION = ['proyecto', 'actividad', 'inversion', 'servicio'] as const;
export const ESTADOS_PROGRAMACION = ['borrador', 'aprobado', 'archivado'] as const;

export type TipoProgramacion = (typeof TIPOS_PROGRAMACION)[number];
export type EstadoProgramacion = (typeof ESTADOS_PROGRAMACION)[number];

export const programacionDetalleSchema = z.object({
  anio_fiscal: z.coerce.number().min(2000).max(2100),
  monto_programado: z.coerce.number().min(0),
  meta_fisica: z.coerce.number().min(0),
  unidad_medida: z.string().optional().or(z.literal('')),
});

export const programacionSchema = z.object({
  entidad_id: z.string().uuid('Seleccione una entidad'),
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(255),
  tipo: z.enum(TIPOS_PROGRAMACION, {
    errorMap: () => ({ message: 'Seleccione un tipo válido' }),
  }),
  anio_inicio: z.coerce.number().min(2000).max(2100),
  anio_fin: z.coerce.number().min(2000).max(2100),
  estado: z.enum(ESTADOS_PROGRAMACION).default('borrador'),
  observaciones: z.string().optional().or(z.literal('')),
  detalles: z.array(programacionDetalleSchema).min(1, 'Debe agregar al menos un año'),
}).refine((data) => data.anio_fin >= data.anio_inicio, {
  message: 'El año fin debe ser mayor o igual al año inicio',
  path: ['anio_fin'],
}).refine((data) => data.anio_fin - data.anio_inicio <= 5, {
  message: 'La programación no puede exceder 5 años',
  path: ['anio_fin'],
});

export type ProgramacionFormValues = z.infer<typeof programacionSchema>;

export interface ProgramacionDetalleEntity {
  id: string;
  programacion_id: string;
  anio_fiscal: number;
  monto_programado: number;
  meta_fisica: number;
  unidad_medida?: string;
  creado_en: string;
}

export interface ProgramacionEntity {
  id: string;
  entidad_id: string;
  nombre: string;
  tipo: TipoProgramacion;
  anio_inicio: number;
  anio_fin: number;
  estado: EstadoProgramacion;
  observaciones?: string;
  detalles: ProgramacionDetalleEntity[];
  monto_total: number;
  cantidad_anios: number;
  creado_en: string;
  actualizado_en?: string;
  entidad_nombre?: string;
}

export interface ProgramacionPaginatedResponse {
  data: ProgramacionEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProgramacionListParams {
  page: number;
  limit: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  entidad_id?: string;
  estado?: string;
  tipo?: string;
}