import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/api-errors';
import type {
  EvaluacionPaginatedResponse,
  EvaluacionListParams,
  ResumenEvaluacion,
  CalcularEvaluacionResponse,
} from '@/types/evaluacion';

export function useEvaluacionList(params: EvaluacionListParams) {
  return useQuery<EvaluacionPaginatedResponse>({
    queryKey: ['evaluaciones', 'list', params],
    queryFn: async () => {
      const sp = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
      });
      if (params.entidad_id) sp.append('entidad_id', params.entidad_id);
      if (params.anio_fiscal) sp.append('anio_fiscal', String(params.anio_fiscal));
      if (params.mes_evaluacion) sp.append('mes_evaluacion', String(params.mes_evaluacion));
      if (params.nivel_riesgo) sp.append('nivel_riesgo', params.nivel_riesgo);

      const res = await api.get(`/evaluacion/?${sp}`);
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useResumenEvaluacion(entidadId?: string, anioFiscal?: number, mes?: number) {
  return useQuery<ResumenEvaluacion>({
    queryKey: ['evaluaciones', 'resumen', entidadId, anioFiscal, mes],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (anioFiscal) params.append('anio_fiscal', String(anioFiscal));
      if (mes) params.append('mes_evaluacion', String(mes));
      if (entidadId) params.append('entidad_id', entidadId);
      
      const res = await api.get(`/evaluacion/resumen?${params}`);
      return res.data;
    },
    enabled: !!anioFiscal && !!mes,
    staleTime: 60_000,
  });
}

export function useCalcularEvaluacion() {
  const qc = useQueryClient();
  return useMutation<CalcularEvaluacionResponse, Error, { anioFiscal: number; mes: number; entidadId?: string }>({
    mutationFn: async ({ anioFiscal, mes, entidadId }) => {
      const params = new URLSearchParams({
        anio_fiscal: String(anioFiscal),
        mes_evaluacion: String(mes),
      });
      if (entidadId) params.append('entidad_id', entidadId);
      
      const res = await api.post(`/evaluacion/calcular?${params}`);
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['evaluaciones'] });
      toast.success(
        `Evaluación completada: ${data.evaluaciones_creadas} de ${data.total_pois} POIs procesados`,
        { duration: 6000 }
      );
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useDeleteEvaluacion() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/evaluacion/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evaluaciones'] });
      toast.success('Evaluación eliminada');
    },
    onError: (err) => {
      toast.error(extractApiError(err));
    },
  });
}