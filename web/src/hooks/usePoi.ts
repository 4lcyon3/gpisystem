import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/api-errors';
import type {
  PoiEntity,
  PoiFormValues,
  PoiPaginatedResponse,
  PoiListParams,
} from '@/types/poi';

export function usePoiList(params: PoiListParams) {
  return useQuery<PoiPaginatedResponse>({
    queryKey: ['pois', 'list', params],
    queryFn: async () => {
      const sp = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        sort_by: params.sort_by || 'creado_en',
        sort_order: params.sort_order || 'desc',
      });
      if (params.search) sp.append('search', params.search);
      if (params.estado) sp.append('estado', params.estado);
      if (params.pei_id) sp.append('pei_id', params.pei_id);
      if (params.entidad_id) sp.append('entidad_id', params.entidad_id);

      const res = await api.get(`/planificacion/poi?${sp}`);
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useCreatePoi() {
  const qc = useQueryClient();
  return useMutation<PoiEntity, Error, PoiFormValues & { entidad_id: string }>({
    mutationFn: (data) => api.post('/planificacion/poi', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pois'] });
      toast.success('Actividad operativa creada');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useUpdatePoi() {
  const qc = useQueryClient();
  return useMutation<PoiEntity, Error, { id: string; data: Partial<PoiFormValues> }>({
    mutationFn: ({ id, data }) =>
      api.put(`/planificacion/poi/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pois'] });
      toast.success('Actividad operativa actualizada');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useDeletePoi() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/planificacion/poi/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pois'] });
      toast.success('Actividad operativa eliminada');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}