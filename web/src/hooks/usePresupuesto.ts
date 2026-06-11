import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/api-errors';
import type {
  PresupuestoEntity,
  PresupuestoFormValues,
  PresupuestoPaginatedResponse,
  PresupuestoListParams,
} from '@/types/presupuesto';

export function usePresupuestoList(params: PresupuestoListParams) {
  return useQuery<PresupuestoPaginatedResponse>({
    queryKey: ['presupuestos', 'list', params],
    queryFn: async () => {
      const sp = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        sort_by: params.sort_by || 'creado_en',
        sort_order: params.sort_order || 'desc',
      });
      if (params.search) sp.append('search', params.search);
      if (params.entidad_id) sp.append('entidad_id', params.entidad_id);
      if (params.anio_fiscal) sp.append('anio_fiscal', String(params.anio_fiscal));
      if (params.centro_costo_id) sp.append('centro_costo_id', params.centro_costo_id);

      const res = await api.get(`/presupuesto/?${sp}`);
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useCreatePresupuesto() {
  const qc = useQueryClient();
  return useMutation<PresupuestoEntity, Error, PresupuestoFormValues>({
    mutationFn: (data) => api.post('/presupuesto/', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presupuestos'] });
      toast.success('Presupuesto creado exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useUpdatePresupuesto() {
  const qc = useQueryClient();
  return useMutation<PresupuestoEntity, Error, { id: string; data: Partial<PresupuestoFormValues> }>({
    mutationFn: ({ id, data }) => api.put(`/presupuesto/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presupuestos'] });
      toast.success('Presupuesto actualizado exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useDeletePresupuesto() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/presupuesto/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presupuestos'] });
      toast.success('Presupuesto eliminado exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}