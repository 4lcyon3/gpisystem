/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import type { UsuarioEntity, UsuarioCreateValues, UsuarioUpdateValues, UseUsuariosOptions } from '@/types/usuario';
export function useUsuarios(options: UseUsuariosOptions = {}) {
  const { includeInactive = false } = options;
  
  return useQuery<UsuarioEntity[]>({
    queryKey: ['usuarios', { includeInactive }],
    queryFn: async () => {
      const params = new URLSearchParams({
        activo: includeInactive ? 'all' : 'true',
      });
      const res = await api.get(`/usuarios/?${params}`);
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useCreateUsuario() {
  const qc = useQueryClient();
  return useMutation<UsuarioEntity, Error, UsuarioCreateValues>({
    mutationFn: (data) => api.post('/usuarios/', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario creado exitosamente');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Error al crear usuario');
    },
  });
}

export function useUpdateUsuario() {
  const qc = useQueryClient();
  return useMutation<UsuarioEntity, Error, { id: string; data: UsuarioUpdateValues }>({
    mutationFn: ({ id, data }) => api.put(`/usuarios/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario actualizado exitosamente');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Error al actualizar usuario');
    },
  });
}

export function useDeleteUsuario() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.delete(`/usuarios/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuario eliminado exitosamente');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Error al eliminar usuario');
    },
  });
}