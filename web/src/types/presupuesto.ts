import { z } from 'zod';

export const presupuestoSchema = z.object({
  entidad_id: z.string().uuid('Debe seleccionar una entidad'),
  poi_id: z.string().uuid('Debe seleccionar un POI').optional().or(z.literal('')),
  centro_costo_id: z.string().uuid('Debe seleccionar un centro de costo'),
  clasificacion_gasto_id: z.string().uuid('Debe seleccionar un clasificador'),
  fuente_datos_id: z.string().uuid('Debe seleccionar una fuente de datos'), // ← NUEVO
  anio_fiscal: z.coerce
    .number()
    .min(2000, 'Año mínimo: 2000')
    .max(2100, 'Año máximo: 2100'),
  meta_presupuestal: z.string().optional().or(z.literal('')),
  pia: z.coerce.number().min(0, 'Debe ser mayor o igual a 0'),
  modificaciones_acumuladas: z.coerce.number().min(0, 'Debe ser mayor o igual a 0').default(0),
});

export type PresupuestoFormValues = z.infer<typeof presupuestoSchema>;


export interface PresupuestoPaginatedResponse {
  data: PresupuestoEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PresupuestoListParams {
  page: number;
  limit: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  entidad_id?: string;
  anio_fiscal?: number;
  centro_costo_id?: string;
}

export interface PresupuestoEntity {
  id: string;
  entidad_id: string;
  poi_id?: string;
  centro_costo_id: string;
  clasificacion_gasto_id: string;
  fuente_datos_id: string;  // ← NUEVO
  anio_fiscal: number;
  meta_presupuestal?: string;
  pia: number;
  pim: number;
  modificaciones_acumuladas: number;
  creado_en: string;
  actualizado_en?: string;
  entidad_nombre?: string;
  centro_costo_nombre?: string;
  clasificador_codigo?: string;
  clasificador_descripcion?: string;
  poi_nombre?: string;
  fuente_datos_nombre?: string;  // ← NUEVO (del JOIN backend)
}
