import { z } from 'zod';

export const peiSchema = z.object({
  entidad_id: z.string().uuid('Debe seleccionar una entidad'), // ✅ Requerido
  codigo_objetivo: z.string().min(1, 'El código es requerido'),
  descripcion: z.string().min(1, 'La descripción es requerida'),
  accion_estrategica: z.string().optional().or(z.literal('')),
  indicador: z.string().optional().or(z.literal('')),
  linea_base: z.string().optional().or(z.literal('')),
  meta_anual: z.string().optional().or(z.literal('')),
  unidad_medida: z.string().optional().or(z.literal('')),
  area_responsable: z.string().optional().or(z.literal('')),
  vigencia_inicio: z.string().min(1, 'La fecha de inicio es requerida'),
  vigencia_fin: z.string().min(1, 'La fecha de fin es requerida'),
  estado: z.enum(['vigente', 'modificado', 'archivado']).default('vigente'),
});

export type PeiFormValues = z.infer<typeof peiSchema>;

export interface PeiEntity {
  id: string;
  entidad_id: string;
  codigo_objetivo: string;
  descripcion: string;
  accion_estrategica?: string;
  indicador?: string;
  linea_base?: string;
  meta_anual?: string;
  unidad_medida?: string;
  area_responsable?: string;
  vigencia_inicio: string;
  vigencia_fin: string;
  estado: 'vigente' | 'modificado' | 'archivado';
  creado_en: string;
  actualizado_en: string;
}

export interface PeiPaginatedResponse {
  data: PeiEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PeiListParams {
  page: number;
  limit: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  estado?: string;
  entidad_id?: string; // ✅ Nuevo filtro
}