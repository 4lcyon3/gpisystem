import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/api-errors';
import type {
  ModificacionEntity,
  ModificacionFormValues,
  ModificacionPaginatedResponse,
  ModificacionListParams,
} from '@/types/modificacion';

export function useModificacionesList(params: ModificacionListParams) {
  return useQuery<ModificacionPaginatedResponse>({
    queryKey: ['modificaciones', 'list', params],
    queryFn: async () => {
      const sp = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        sort_by: params.sort_by || 'fecha_aprobacion',
        sort_order: params.sort_order || 'desc',
      });
      if (params.search) sp.append('search', params.search);
      if (params.entidad_id) sp.append('entidad_id', params.entidad_id);
      if (params.tipo_modificacion) sp.append('tipo_modificacion', params.tipo_modificacion);
      if (params.estado) sp.append('estado', params.estado);
      if (params.anio) sp.append('anio', String(params.anio));

      const res = await api.get(`/modificaciones/?${sp}`);
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateModificacion() {
  const qc = useQueryClient();
  return useMutation<ModificacionEntity, Error, ModificacionFormValues>({
    mutationFn: (data) => api.post('/modificaciones/', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modificaciones'] });
      qc.invalidateQueries({ queryKey: ['presupuestos'] }); // Refrescar PIM
      qc.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('Modificación presupuestaria registrada');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useUpdateModificacion() {
  const qc = useQueryClient();
  return useMutation<
    ModificacionEntity,
    Error,
    { id: string; data: Partial<ModificacionFormValues> }
  >({
    mutationFn: ({ id, data }) =>
      api.put(`/modificaciones/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modificaciones'] });
      qc.invalidateQueries({ queryKey: ['presupuestos'] });
      qc.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('Modificación actualizada exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useDeleteModificacion() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/modificaciones/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modificaciones'] });
      qc.invalidateQueries({ queryKey: ['presupuestos'] });
      qc.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('Modificación eliminada exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}