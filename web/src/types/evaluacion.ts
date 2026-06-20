export const NIVELES_RIESGO = ['normal', 'alerta', 'critico'] as const;
export type NivelRiesgo = (typeof NIVELES_RIESGO)[number];

export const NIVELES_CONFIG: Record<NivelRiesgo, { label: string; color: string; bgColor: string; borderColor: string }> = {
  normal: { 
    label: 'Normal', 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-50', 
    borderColor: 'border-emerald-200' 
  },
  alerta: { 
    label: 'Alerta', 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-50', 
    borderColor: 'border-amber-200' 
  },
  critico: { 
    label: 'Crítico', 
    color: 'text-red-700', 
    bgColor: 'bg-red-50', 
    borderColor: 'border-red-200' 
  },
};

export interface EvaluacionEntity {
  id: string;
  poi_id: string;
  entidad_id: string;
  anio_fiscal: number;
  mes_evaluacion: number;
  meta_fisica_programada: number;
  meta_fisica_ejecutada: number;
  presupuesto_programado: number;
  presupuesto_ejecutado: number;
  indice_eficacia: number;
  indice_eficiencia: number;
  porcentaje_ejecucion: number;
  nivel_riesgo: NivelRiesgo;
  creado_en: string;
  actualizado_en?: string;
  // JOINs
  poi_codigo?: string;
  poi_nombre?: string;
  entidad_nombre?: string;
}

export interface EvaluacionPaginatedResponse {
  data: EvaluacionEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EvaluacionListParams {
  page: number;
  limit: number;
  entidad_id?: string;
  anio_fiscal?: number;
  mes_evaluacion?: number;
  nivel_riesgo?: NivelRiesgo;
}

export interface ResumenEvaluacion {
  total_pois: number;
  pois_normales: number;
  pois_alerta: number;
  pois_criticos: number;
  eficacia_promedio: number;
  eficiencia_promedio: number;
  ejecucion_promedio: number;
  presupuesto_total: number;
  gasto_total: number;
}

export interface CalcularEvaluacionResponse {
  mensaje: string;
  evaluaciones_creadas: number;
  total_pois: number;
}

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