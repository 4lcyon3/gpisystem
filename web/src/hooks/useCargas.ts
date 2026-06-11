/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

export interface Carga {
  id: string;
  nombre_archivo: string;
  tipo_archivo: string;
  tamanio_bytes: number;
  estado: 'pendiente' | 'procesando' | 'procesado' | 'error';
  filas_total: number;
  filas_ok: number;
  filas_error: number;
  creado_en: string;
  procesado_en: string | null;
}

export interface CargaDetalle {
  numero_fila: number;
  estado: string;
  mensaje_error: string | null;
}

export interface UploadResponse {
  mensaje: string;
  carga_id: string;
  estado: string;
}

export interface CargaProgress {
  carga_id: string;
  estado: string;
  filas_total: number;
  filas_ok: number;
  filas_error: number;
  progreso: number;
}

// Fetchers
const fetchCargas = async (): Promise<Carga[]> => {
  const response = await api.get('/cargas/?limit=50');
  return response.data;
};

const fetchCargaDetalle = async (id: string): Promise<Carga> => {
  const response = await api.get(`/cargas/${id}`);
  return response.data;
};

const fetchErroresCarga = async (id: string): Promise<CargaDetalle[]> => {
  const response = await api.get(`/cargas/${id}/errores`);
  return response.data;
};

const uploadArchivo = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/cargas/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Hooks
export function useCargas() {
  return useQuery({
    queryKey: ['cargas'],
    queryFn: fetchCargas,
    staleTime: 30 * 1000,
  });
}

export function useCargaDetalle(id: string | null) {
  return useQuery({
    queryKey: ['carga', id],
    queryFn: () => fetchCargaDetalle(id!),
    enabled: !!id,
    staleTime: 10 * 1000,
  });
}

export function useErroresCarga(id: string | null) {
  return useQuery({
    queryKey: ['carga-errores', id],
    queryFn: () => fetchErroresCarga(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useUploadArchivo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadArchivo,
    onSuccess: () => {
      toast.success('Archivo recibido', {
        description: 'El Worker lo procesará en segundos',
      });
      // Invalidar lista de cargas para que aparezca la nueva
      queryClient.invalidateQueries({ queryKey: ['cargas'] });
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || 'Error al subir el archivo';
      toast.error('Error en upload', { description: message });
    },
  });
}