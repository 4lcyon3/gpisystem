import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/api-errors';
import type {
  AvanceEntity,
  AvanceFormValues,
  AvancePaginatedResponse,
  AvanceListParams,
  ResumenMensual,
} from '@/types/avance';

export function useAvancesList(params: AvanceListParams) {
  return useQuery<AvancePaginatedResponse>({
    queryKey: ['avances', 'list', params],
    queryFn: async () => {
      const sp = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        sort_by: params.sort_by || 'anio',
        sort_order: params.sort_order || 'desc',
      });
      if (params.search) sp.append('search', params.search);
      if (params.entidad_id) sp.append('entidad_id', params.entidad_id);
      if (params.poi_id) sp.append('poi_id', params.poi_id);
      if (params.anio) sp.append('anio', String(params.anio));
      if (params.mes) sp.append('mes', String(params.mes));

      const res = await api.get(`/avances/?${sp}`);
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useResumenAnual(entidadId?: string, anio?: number) {
  return useQuery<{ anio: number; data: ResumenMensual[] }>({
    queryKey: ['avances', 'resumen', entidadId, anio],
    queryFn: async () => {
      const params = new URLSearchParams({ anio: String(anio) });
      
      if (entidadId && entidadId !== '__all__') {
        params.append('entidad_id', entidadId);
      }
      
      const res = await api.get(`/avances/resumen/anual?${params}`);
      return res.data;
    },
    enabled: !!anio,
    staleTime: 60_000,
  });
}

export function useCreateAvance() {
  const qc = useQueryClient();
  return useMutation<AvanceEntity, Error, AvanceFormValues>({
    mutationFn: (data) => api.post('/avances/', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['avances'] });
      toast.success('Avance físico registrado exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useUpdateAvance() {
  const qc = useQueryClient();
  return useMutation<AvanceEntity, Error, { id: string; data: Partial<AvanceFormValues> }>({
    mutationFn: ({ id, data }) => api.put(`/avances/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['avances'] });
      toast.success('Avance actualizado exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}

export function useDeleteAvance() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/avances/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['avances'] });
      toast.success('Avance eliminado exitosamente');
    },
    onError: (err) => {
      toast.error(extractApiError(err), { duration: 8000 });
    },
  });
}