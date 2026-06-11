import { z } from 'zod';

export const ESTADOS_DISPONIBILIDAD = ['pendiente', 'aprobado', 'rechazado'] as const;
export type EstadoDisponibilidad = (typeof ESTADOS_DISPONIBILIDAD)[number];

export const disponibilidadSchema = z.object({
  entidad_id: z.string().uuid('Debe seleccionar una entidad'),
  centro_costo_id: z.string().uuid('Debe seleccionar un centro de costo'),
  poi_id: z.string().uuid('Debe seleccionar un POI'),
  meta_id: z.string().uuid().optional().or(z.literal('')),
  clasificacion_id: z.string().uuid('Debe seleccionar un clasificador'),
  fuente_id: z.string().uuid('Debe seleccionar una fuente'),
  anio_fiscal: z.coerce.number().min(2000).max(2100),
  numero_solicitud: z.string().min(3, 'Mínimo 3 caracteres').max(50),
  monto_solicitado: z.coerce.number().min(0.01, 'Debe ser mayor a 0'),
  descripcion: z.string().optional().or(z.literal('')),
  fecha_solicitud: z.string().min(1, 'La fecha es requerida'),
});

export type DisponibilidadFormValues = z.infer<typeof disponibilidadSchema>;

export interface DisponibilidadEntity {
  id: string;
  entidad_id: string;
  centro_costo_id: string;
  poi_id: string;
  meta_id?: string;
  clasificacion_id: string;
  fuente_id: string;
  anio_fiscal: number;
  numero_solicitud: string;
  monto_solicitado: number;
  monto_aprobado: number;
  descripcion?: string;
  observaciones?: string;
  estado: EstadoDisponibilidad;
  fecha_solicitud: string;
  aprobado_por?: string;
  fecha_aprobacion?: string;
  creado_en: string;
  actualizado_en?: string;
  // Campos relacionados
  entidad_nombre?: string;
  centro_costo_nombre?: string;
  poi_nombre?: string;
  clasificador_codigo?: string;
  clasificador_descripcion?: string;
  fuente_nombre?: string;
}

export interface DisponibilidadPaginatedResponse {
  data: DisponibilidadEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DisponibilidadListParams {
  page: number;
  limit: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  entidad_id?: string;
  estado?: string;
  anio_fiscal?: number;
}