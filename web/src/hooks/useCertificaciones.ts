import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/api-errors';
import type {
  CertificacionEntity,
  CertificacionFormValues,
  CertificacionPaginatedResponse,
  CertificacionListParams,
} from '@/types/certificacion';

export function useCertificacionesList(params: CertificacionListParams) {
  return useQuery<CertificacionPaginatedResponse>({
    queryKey: ['certificaciones', 'list', params],
    queryFn: async () => {
      const sp = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        sort_by: params.sort_by || 'fecha_certificacion',
        sort_order: params.sort_order || 'desc',
      });
      if (params.search) sp.append('search', params.search);
      if (params.entidad_id) sp.append('entidad_id', params.entidad_id);
      if (params.estado) sp.append('estado', params.estado);
      if (params.anio_fiscal) sp.append('anio_fiscal', String(params.anio_fiscal));

      const res = await api.get(`/certificaciones/?${sp}`);
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateCertificacion() {
  const qc = useQueryClient();
  return useMutation<CertificacionEntity, Error, CertificacionFormValues>({
    mutationFn: (data) => api.post('/certificaciones/', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certificaciones'] });
      qc.invalidateQueries({ queryKey: ['disponibilidades'] });
      toast.success('Certificado de Crédito Presupuestario emitido');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useAnularCertificacion() {
  const qc = useQueryClient();
  return useMutation<
    CertificacionEntity,
    Error,
    { id: string; observaciones: string }
  >({
    mutationFn: ({ id, observaciones }) =>
      api.post(`/certificaciones/${id}/anular`, null, {
        params: { observaciones },
      }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certificaciones'] });
      toast.success('Certificación anulada - saldo liberado');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useDeleteCertificacion() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/certificaciones/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certificaciones'] });
      toast.success('Certificación eliminada');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}