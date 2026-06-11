import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/api-errors';
import type {
  PeiEntity,
  PeiFormValues,
  PeiPaginatedResponse,
  PeiListParams,
} from '@/types/pei';

export function usePeiList(params: PeiListParams) {
  return useQuery<PeiPaginatedResponse>({
    queryKey: ['peis', 'list', params],
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

      const res = await api.get(`/planificacion/pei?${sp}`);
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useCreatePei() {
  const qc = useQueryClient();
  return useMutation<PeiEntity, Error, PeiFormValues>({
    mutationFn: (data) => api.post('/planificacion/pei', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peis'] });
      toast.success('Objetivo estratégico creado');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useUpdatePei() {
  const qc = useQueryClient();
  return useMutation<PeiEntity, Error, { id: string; data: Partial<PeiFormValues> }>({
    mutationFn: ({ id, data }) =>
      api.put(`/planificacion/pei/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peis'] });
      toast.success('Objetivo estratégico actualizado');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useDeletePei() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/planificacion/pei/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['peis'] });
      toast.success('Objetivo estratégico eliminado');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}