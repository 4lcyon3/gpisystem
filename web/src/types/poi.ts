import { z } from 'zod';

export const ESTADOS_POI = ['programada', 'en_ejecucion', 'completada', 'cancelada'] as const;
export type EstadoPOI = (typeof ESTADOS_POI)[number];

export const poiSchema = z.object({
  // ✅ REQUERIDOS: No permiten strings vacíos
  pei_id: z
    .string()
    .uuid('Debe seleccionar un objetivo estratégico (PEI)')
    .min(1, 'Debe seleccionar un PEI'),
  codigo_actividad: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido').max(255),
  fecha_inicio: z
    .string()
    .min(1, 'La fecha de inicio es requerida')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  fecha_fin: z
    .string()
    .min(1, 'La fecha de fin es requerida')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  
  area_responsable: z.string().optional().or(z.literal('')),
  responsable_directo: z.string().optional().or(z.literal('')),
  unidad_medida: z.string().optional().or(z.literal('')),
  fuente_financiamiento_preliminar: z.string().optional().or(z.literal('')),

  meta_fisica_anual: z.coerce.number().min(0).optional(),
  presupuesto_estimado: z.coerce.number().min(0).optional(),
  
  estado: z.enum(ESTADOS_POI).default('programada'),
}).refine((data) => {
  if (data.fecha_inicio && data.fecha_fin) {
    return new Date(data.fecha_fin) >= new Date(data.fecha_inicio);
  }
  return true;
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['fecha_fin'],
});

export type PoiFormValues = z.infer<typeof poiSchema>;

export interface PoiEntity {
  id: string;
  entidad_id: string;
  pei_id: string;
  codigo_actividad: string;
  nombre: string;
  area_responsable?: string;
  responsable_directo?: string;
  unidad_medida?: string;
  meta_fisica_anual?: number;
  fecha_inicio: string;
  fecha_fin: string;
  presupuesto_estimado?: number;
  fuente_financiamiento_preliminar?: string;
  estado: EstadoPOI;
  creado_en: string;
  actualizado_en?: string;
  // Campos relacionados (incluidos por el backend)
  pei_codigo?: string;
  pei_descripcion?: string;
}

export interface PoiPaginatedResponse {
  data: PoiEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PoiListParams {
  page: number;
  limit: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  estado?: string;
  pei_id?: string;
  entidad_id?: string;
}