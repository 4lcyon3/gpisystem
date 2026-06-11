/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import type { EntidadEntity, EntidadFormValues, UseEntidadesOptions } from '@/types/entidad';

export function useEntidades(options: UseEntidadesOptions = {}) {
  const { includeInactive = false, enabled = true } = options;
  
  return useQuery<EntidadEntity[]>({
    queryKey: ['entidades', { includeInactive }],
    queryFn: async () => {
      const params = new URLSearchParams({
        activo: includeInactive ? 'all' : 'true',  // ← Condición clave
      });
      const res = await api.get(`/catalogos/entidades?${params}`);
      return res.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}


export function useCreateEntidad() {
  const qc = useQueryClient();
  return useMutation<EntidadEntity, Error, EntidadFormValues>({
    mutationFn: (data) => api.post('/catalogos/entidades', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entidades'] });
      toast.success('Entidad creada exitosamente');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Error al crear entidad');
    },
  });
}

export function useUpdateEntidad() {
  const qc = useQueryClient();
  return useMutation<EntidadEntity, Error, { id: string; data: Partial<EntidadFormValues> }>({
    mutationFn: ({ id, data }) =>
      api.put(`/catalogos/entidades/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entidades'] });
      toast.success('Entidad actualizada exitosamente');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Error al actualizar entidad');
    },
  });
}

export function useDeleteEntidad() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/catalogos/entidades/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entidades'] });
      toast.success('Entidad eliminada exitosamente');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Error al eliminar entidad');
    },
  });
}