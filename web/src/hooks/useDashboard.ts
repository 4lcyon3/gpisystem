import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

// ==================== TIPOS DE FILTROS ====================
export interface DashboardFilters {
  anio: number;
  entidad_id?: string;
  trimestre?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'all';
  mes?: number | 'all';
  fases?: string[];
  clasificador_id?: string;
  compararAnioAnterior?: boolean;
}

export interface KPIsData {
  pia_total: number | string;
  pim_total: number | string;
  certificado: number | string;
  comprometido: number | string;
  devengado: number | string;
  girado: number | string;
  porcentaje_ejecucion: number | string;
  saldo_disponible: number | string;
  total_entidades: number;
  alertas_rojas: number;
  variacion_pia?: number | string;
  variacion_pim?: number | string;
  variacion_devengado?: number | string;
}

export interface EvolucionMensual {
  anio: number;
  mes: number;
  mes_nombre: string;
  devengado: number | string;
  girado: number | string;
  pim: number | string;
  devengado_anterior?: number | string;
  pim_anterior?: number | string;
}

export interface RankingEntidad {
  entidad_nombre: string;
  ruc: string;
  pim: number | string;
  devengado: number | string;
  porcentaje: number | string;
  variacion?: number | string;
}

export interface Alerta {
  tipo_alerta: string;
  nivel: 'rojo' | 'amarillo' | 'verde';
  mensaje: string;
  entidad_nombre: string | null;
}

export interface Entidad {
  id: string;
  nombre: string;
  ruc: string;
  sector: string | null;
}

export interface ClasificadorGasto {
  id: string;
  codigo: string;
  descripcion: string;
  generica: string | null;
}

// ==================== HELPERS ====================
const buildQueryParams = (filters: DashboardFilters) => {
  const params = new URLSearchParams({ anio: filters.anio.toString() });
  if (filters.entidad_id && filters.entidad_id !== 'todas') {
    params.append('entidad_id', filters.entidad_id);
  }
  if (filters.trimestre && filters.trimestre !== 'all') {
    params.append('trimestre', filters.trimestre);
  }
  if (filters.mes && filters.mes !== 'all') {
    params.append('mes', filters.mes.toString());
  }
  if (filters.clasificador_id) params.append('clasificador_id', filters.clasificador_id);
  if (filters.fases && filters.fases.length > 0) {
    filters.fases.forEach(f => params.append('fases', f));
  }
  if (filters.compararAnioAnterior) {
    params.append('comparar', 'true');
  }
  return params;
};

// ==================== FETCHERS ====================
const fetchKPIs = async (filters: DashboardFilters): Promise<KPIsData> => {
  const params = buildQueryParams(filters);
  const response = await api.get(`/analitica/kpis?${params}`);
  return response.data;
};

const fetchEvolucion = async (filters: DashboardFilters): Promise<EvolucionMensual[]> => {
  const params = buildQueryParams(filters);
  const response = await api.get(`/analitica/evolucion-mensual?${params}`);
  return response.data;
};

const fetchRanking = async (filters: DashboardFilters): Promise<RankingEntidad[]> => {
  const params = buildQueryParams(filters);
  params.append('limit', '10');
  const response = await api.get(`/analitica/ranking-entidades?${params}`);
  return response.data;
};

const fetchAlertas = async (nivel?: string): Promise<Alerta[]> => {
  const params = new URLSearchParams({ limit: '20' });
  if (nivel) params.append('nivel', nivel);
  const response = await api.get(`/analitica/alertas?${params}`);
  return response.data;
};

const fetchEntidades = async (): Promise<Entidad[]> => {
  const response = await api.get('/catalogos/entidades');
  return response.data;
};

const fetchClasificadores = async (): Promise<ClasificadorGasto[]> => {
  const response = await api.get('/catalogos/clasificadores');
  return response.data;
};

// ==================== HOOKS ====================
export function useKPIs(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['kpis', filters],
    queryFn: () => fetchKPIs(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useEvolucionMensual(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['evolucion-mensual', filters],
    queryFn: () => fetchEvolucion(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useRankingEntidades(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['ranking-entidades', filters],
    queryFn: () => fetchRanking(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAlertas(nivel?: string) {
  return useQuery({
    queryKey: ['alertas', nivel],
    queryFn: () => fetchAlertas(nivel),
    staleTime: 1 * 60 * 1000,
  });
}

export function useEntidades() {
  return useQuery({
    queryKey: ['entidades'],
    queryFn: fetchEntidades,
    staleTime: 10 * 60 * 1000,
  });
}

export function useClasificadores() {
  return useQuery({
    queryKey: ['clasificadores'],
    queryFn: fetchClasificadores,
    staleTime: 10 * 60 * 1000,
  });
}