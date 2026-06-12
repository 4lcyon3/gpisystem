/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { extractApiError } from '@/lib/api-errors';
import type { CentroCosto, MetaPresupuestal, FuenteFinanciamiento, ImportResult, Clasificador } from '@/types/catalogos';



// ============ QUERIES ============
export const useCentrosCosto = (entidadId?: string) => useQuery<CentroCosto[]>({
  queryKey: ['centros-costo', entidadId],
  queryFn: async () => {
    const params = new URLSearchParams({ activo: 'all' });
    if (entidadId) params.append('entidad_id', entidadId);
    const res = await api.get(`/catalogos/centros-costo?${params}`);
    return res.data;
  },
  staleTime: 60_000,
});

export const useMetasPresupuestales = (entidadId?: string) => useQuery<MetaPresupuestal[]>({
  queryKey: ['metas-presupuestales', entidadId],
  queryFn: async () => {
    const params = new URLSearchParams();
    if (entidadId) params.append('entidad_id', entidadId);
    const res = await api.get(`/catalogos/metas-presupuestales?${params}`);
    return res.data;
  },
  staleTime: 60_000,
});

export const useFuentesFinanciamiento = (includeInactive = false) => useQuery<FuenteFinanciamiento[]>({
  queryKey: ['fuentes-financiamiento', { includeInactive }],
  queryFn: async () => {
    const params = new URLSearchParams();
    params.append('activo', includeInactive ? 'all' : 'true');
    const res = await api.get(`/catalogos/fuentes-financiamiento?${params}`);
    return res.data;
  },
  staleTime: 60_000,
});

export const useClasificadores = (includeInactive = false) => useQuery<Clasificador[]>({
  queryKey: ['clasificadores', { includeInactive }],
  queryFn: async () => {
    const params = new URLSearchParams();
    params.append('activo', includeInactive ? 'all' : 'true');
    const res = await api.get(`/catalogos/clasificadores?${params}`);
    return res.data;
  },
  staleTime: 60_000,
});


// ============ CREAR ============
export const useCreateCentroCosto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/catalogos/centros-costo', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['centros-costo'] });
      toast.success('Centro de costo creado exitosamente');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });
};

export const useCreateMetaPresupuestal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/catalogos/metas-presupuestales', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metas-presupuestales'] });
      toast.success('Meta presupuestal creada exitosamente');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });
};

export const useCreateFuenteFinanciamiento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/catalogos/fuentes-financiamiento', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fuentes-financiamiento'] });
      toast.success('Fuente de financiamiento creada exitosamente');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });
};

export const useCreateClasificador = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/catalogos/clasificadores', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clasificadores'] });
      toast.success('Clasificador creado exitosamente');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });
};


// ============ ACTUALIZAR ============
export const useUpdateCentroCosto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/catalogos/centros-costo/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['centros-costo'] });
      toast.success('Centro de costo actualizado');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });
};

export const useUpdateMetaPresupuestal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/catalogos/metas-presupuestales/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metas-presupuestales'] });
      toast.success('Meta actualizada');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });
};

export const useUpdateFuenteFinanciamiento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/catalogos/fuentes-financiamiento/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fuentes-financiamiento'] });
      toast.success('Fuente actualizada');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });
};

export const useUpdateClasificador = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/catalogos/clasificadores/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clasificadores'] });
      toast.success('Clasificador actualizado');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });
};

// ============ ELIMINAR ============
export const useDeleteCentroCosto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/catalogos/centros-costo/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['centros-costo'] });
      toast.success('Centro de costo eliminado');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });
};

export const useDeleteMetaPresupuestal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/catalogos/metas-presupuestales/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metas-presupuestales'] });
      toast.success('Meta eliminada');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });
};

export const useDeleteFuenteFinanciamiento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/catalogos/fuentes-financiamiento/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fuentes-financiamiento'] });
      toast.success('Fuente eliminada');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });
};

export const useDeleteClasificador = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/catalogos/clasificadores/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clasificadores'] });
      toast.success('Clasificador eliminado');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });
};

// ============ IMPORTAR CSV ============
export const useImportarCatalogo = (tipo: string) => {
  const qc = useQueryClient();
  return useMutation<ImportResult, Error, File>({
    mutationFn: async (file) => {
      if (!file) {
        throw new Error('No se proporcionó ningún archivo');
      }
      const formData = new FormData();
      formData.append('file', file, file.name);
      
      const res = await api.post(`/catalogos/importar/${tipo}`, formData, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ 
        queryKey: [tipo === 'centros-costo' ? 'centros-costo' : tipo === 'metas-presupuestales' ? 'metas-presupuestales' : 'fuentes-financiamiento'] 
      });
      if (data.errores === 0) {
        toast.success(`¡Éxito! ${data.exitosos} registros procesados.`);
      } else {
        toast.warning(`Procesado con ${data.errores} errores`, {
          description: `${data.exitosos} exitosos. Revise la consola.`,
          duration: 8000,
        });
        console.warn('Detalles de errores:', data.detalles_error);
      }
    },
    onError: (err: any) => {
      console.error('Error en importación:', err);
      toast.error(extractApiError(err) || 'Error al procesar el archivo');
    },
  });
};

// ============ DESCARGAR PLANTILLA (CORREGIDO) ============
export const descargarPlantilla = async (tipo: string) => {
  try {
    const res = await api.get(`/catalogos/plantilla/${tipo}`, {
      responseType: 'blob',
    });
    
    // Extraer filename del header Content-Disposition
    const disposition = res.headers['content-disposition'] || '';
    let filename = `plantilla_${tipo}.csv`;
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match) filename = match[1];
    
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success('Plantilla descargada');
  } catch (err: any) {
    toast.error(extractApiError(err) || 'Error al descargar la plantilla');
  }
};

export const useBulkDeleteCatalogo = (tipo: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const endpoint = tipo === 'centros-costo' 
        ? '/catalogos/centros-costo/bulk-delete'
        : tipo === 'metas-presupuestales'
        ? '/catalogos/metas-presupuestales/bulk-delete'
        : '/catalogos/fuentes-financiamiento/bulk-delete';
      
      const res = await api.post(endpoint, { ids });
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: [tipo] });
      toast.success(data.message || 'Registros eliminados exitosamente');
    },
    onError: (err: any) => {
      toast.error(extractApiError(err));
    },
  });
};