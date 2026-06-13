import { z } from 'zod';

export const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
] as const;

export const avanceSchema = z.object({
  entidad_id: z.string().uuid('Seleccione una entidad'),
  poi_id: z.string().uuid('Seleccione una actividad operativa'),
  mes: z.coerce.number().min(1).max(12),
  anio: z.coerce.number().min(2000).max(2100),
  meta_programada: z.coerce.number().min(0, 'No puede ser negativo'),
  meta_ejecutada: z.coerce.number().min(0, 'No puede ser negativo'),
  observaciones: z.string().optional().or(z.literal('')),
});

export type AvanceFormValues = z.infer<typeof avanceSchema>;

export interface AvanceEntity {
  id: string;
  poi_id: string;
  entidad_id: string;
  mes: number;
  anio: number;
  meta_programada: number;
  meta_ejecutada: number;
  observaciones?: string;
  porcentaje_avance?: number;
  mes_nombre?: string;
  creado_en: string;
  actualizado_en?: string;
  // JOINs
  entidad_nombre?: string;
  poi_codigo?: string;
  poi_nombre?: string;
  poi_area_responsable?: string;
  registrador_nombre?: string;
}

export interface AvancePaginatedResponse {
  data: AvanceEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AvanceListParams {
  page: number;
  limit: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  entidad_id?: string;
  poi_id?: string;
  anio?: number;
  mes?: number;
}

export interface ResumenMensual {
  mes: number;
  mes_nombre: string;
  total_programada: number;
  total_ejecutada: number;
  porcentaje: number;
  cantidad_avances: number;
}