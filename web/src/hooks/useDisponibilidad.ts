import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/api-errors';
import type {
  DisponibilidadEntity,
  DisponibilidadFormValues,
  DisponibilidadPaginatedResponse,
  DisponibilidadListParams,
} from '@/types/disponibilidad';

export function useDisponibilidadList(params: DisponibilidadListParams) {
  return useQuery<DisponibilidadPaginatedResponse>({
    queryKey: ['disponibilidades', 'list', params],
    queryFn: async () => {
      const sp = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        sort_by: params.sort_by || 'fecha_solicitud',
        sort_order: params.sort_order || 'desc',
      });
      if (params.search) sp.append('search', params.search);
      if (params.entidad_id) sp.append('entidad_id', params.entidad_id);
      if (params.estado) sp.append('estado', params.estado);
      if (params.anio_fiscal) sp.append('anio_fiscal', String(params.anio_fiscal));

      const res = await api.get(`/disponibilidad/?${sp}`);
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateDisponibilidad() {
  const qc = useQueryClient();
  return useMutation<DisponibilidadEntity, Error, DisponibilidadFormValues>({
    mutationFn: (data) => api.post('/disponibilidad/', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disponibilidades'] });
      toast.success('Solicitud de disponibilidad creada');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useUpdateDisponibilidad() {
  const qc = useQueryClient();
  return useMutation<
    DisponibilidadEntity,
    Error,
    { id: string; data: Partial<DisponibilidadFormValues> }
  >({
    mutationFn: ({ id, data }) =>
      api.put(`/disponibilidad/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disponibilidades'] });
      toast.success('Solicitud actualizada exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useAprobarDisponibilidad() {
  const qc = useQueryClient();
  return useMutation<
    DisponibilidadEntity,
    Error,
    { id: string; monto_aprobado: number; observaciones?: string }
  >({
    mutationFn: ({ id, ...data }) =>
      api.post(`/disponibilidad/${id}/aprobar`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disponibilidades'] });
      qc.invalidateQueries({ queryKey: ['presupuestos'] });
      toast.success('Solicitud aprobada exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useRechazarDisponibilidad() {
  const qc = useQueryClient();
  return useMutation<DisponibilidadEntity, Error, { id: string; observaciones: string }>({
    mutationFn: ({ id, ...data }) =>
      api.post(`/disponibilidad/${id}/rechazar`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disponibilidades'] });
      toast.success('Solicitud rechazada');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useDeleteDisponibilidad() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/disponibilidad/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disponibilidades'] });
      toast.success('Solicitud eliminada exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}