import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/api-errors';
import type {
  ProgramacionEntity,
  ProgramacionFormValues,
  ProgramacionPaginatedResponse,
  ProgramacionListParams,
} from '@/types/programacion';

export function useProgramacionList(params: ProgramacionListParams) {
  return useQuery<ProgramacionPaginatedResponse>({
    queryKey: ['programaciones', 'list', params],
    queryFn: async () => {
      const sp = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        sort_by: params.sort_by || 'creado_en',
        sort_order: params.sort_order || 'desc',
      });
      if (params.search) sp.append('search', params.search);
      if (params.entidad_id) sp.append('entidad_id', params.entidad_id);
      if (params.estado) sp.append('estado', params.estado);
      if (params.tipo) sp.append('tipo', params.tipo);

      const res = await api.get(`/programacion/?${sp}`);
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useProgramacion(id: string) {
  return useQuery<ProgramacionEntity>({
    queryKey: ['programaciones', id],
    queryFn: async () => {
      const res = await api.get(`/programacion/${id}`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateProgramacion() {
  const qc = useQueryClient();
  return useMutation<ProgramacionEntity, Error, ProgramacionFormValues>({
    mutationFn: (data) => api.post('/programacion/', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['programaciones'] });
      toast.success('Programación multianual creada exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useUpdateProgramacion() {
  const qc = useQueryClient();
  return useMutation<
    ProgramacionEntity,
    Error,
    { id: string; data: Partial<ProgramacionFormValues> }
  >({
    mutationFn: ({ id, data }) =>
      api.put(`/programacion/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['programaciones'] });
      toast.success('Programación actualizada exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useAprobarProgramacion() {
  const qc = useQueryClient();
  return useMutation<ProgramacionEntity, Error, string>({
    mutationFn: (id) => api.post(`/programacion/${id}/aprobar`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['programaciones'] });
      toast.success('Programación aprobada exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useDeleteProgramacion() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/programacion/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['programaciones'] });
      toast.success('Programación eliminada exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useArchivarProgramacion() {
  const qc = useQueryClient();
  return useMutation<ProgramacionEntity, Error, string>({
    mutationFn: (id) => api.post(`/programacion/${id}/archivar`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['programaciones'] });
      toast.success('Programación archivada exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useRestaurarProgramacion() {
  const qc = useQueryClient();
  return useMutation<ProgramacionEntity, Error, string>({
    mutationFn: (id) => api.post(`/programacion/${id}/restaurar`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['programaciones'] });
      toast.success('Programación restaurada a estado Aprobado');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

/**
 * Sugerencia PIA
**/

export interface SugerenciaPIA {
  programacion_id: string;
  nombre: string;
  tipo: string;
  monto_sugerido: number;
  meta_fisica_sugerida: number;
  anio_fiscal: number;
}

export interface SugerenciaResponse {
  entidad_id: string;
  anio_fiscal: number;
  total_sugerido: number;
  cantidad_programas: number;
  sugerencias: SugerenciaPIA[];
}

export function useSugerenciaPIA(entidadId?: string, anioFiscal?: number) {
  return useQuery<SugerenciaResponse>({
    queryKey: ['programaciones', 'sugerencia', entidadId, anioFiscal],
    queryFn: async () => {
      const res = await api.get(`/programacion/sugerencia/${entidadId}/${anioFiscal}`);
      return res.data;
    },
    enabled: !!entidadId && !!anioFiscal,
    staleTime: 60_000,
  });
}

export interface AnaliticaHistorico {
  total_programaciones: number;
  por_estado: Record<string, number>;
  por_tipo: Record<string, number>;
  total_historico_programado: number;
  evolucion_anual: Array<{
    anio: number;
    cantidad: number;
    monto_total: number;
  }>;
}

export function useAnaliticaHistorico(entidadId?: string) {
  return useQuery<AnaliticaHistorico>({
    queryKey: ['programaciones', 'analitica', entidadId],
    queryFn: async () => {
      const params = entidadId ? `?entidad_id=${entidadId}` : '';
      const res = await api.get(`/programacion/analitica/historico${params}`);
      return res.data;
    },
    staleTime: 60_000,
  });
}