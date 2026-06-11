import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export interface FuenteFinanciamiento {
  id: string;
  codigo: string;
  nombre: string;
  tipo_rubro?: string;
}

export function useFuentesFinanciamiento() {
  return useQuery<FuenteFinanciamiento[]>({
    queryKey: ['fuentes-financiamiento'],
    queryFn: async () => {
      // Ajusta la ruta si tu endpoint es /catalogos/fuentes
      const res = await api.get('/catalogos/fuentes-financiamiento'); 
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export interface MetaPresupuestal {
  id: string;
  codigo: string;
  nombre: string;
}

export function useMetasPresupuestales(entidadId?: string, anioFiscal?: number) {
  return useQuery<MetaPresupuestal[]>({
    queryKey: ['metas-presupuestales', entidadId, anioFiscal],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (entidadId) params.append('entidad_id', entidadId);
      if (anioFiscal) params.append('anio_fiscal', String(anioFiscal));
      const res = await api.get(`/catalogos/metas-presupuestales?${params}`);
      return res.data;
    },
    enabled: !!entidadId && !!anioFiscal,
    staleTime: 5 * 60 * 1000,
  });
}