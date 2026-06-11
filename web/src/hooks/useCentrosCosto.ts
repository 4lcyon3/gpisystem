import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export interface CentroCosto {
  id: string;
  codigo: string;
  nombre: string;
  entidad_id: string;
  activo: boolean;
}

interface UseCentrosCostoOptions {
  includeInactive?: boolean;
}
export function useCentrosCosto(entidadId?: string, options: UseCentrosCostoOptions = {}) {
  const { includeInactive = false } = options;
  
  return useQuery<CentroCosto[]>({
    queryKey: ['centros-costo', entidadId, { includeInactive }],
    queryFn: async () => {
      const params = new URLSearchParams({
        activo: includeInactive ? 'all' : 'true',
      });
      if (entidadId) params.append('entidad_id', entidadId);
      const res = await api.get(`/catalogos/centros-costo?${params}`);
      return res.data;
    },
    enabled: !!entidadId,
    staleTime: 5 * 60 * 1000,
  });
}