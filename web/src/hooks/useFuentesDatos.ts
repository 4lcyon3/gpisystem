import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export interface FuenteDatos {
  id: string;
  nombre: string;
  tipo?: string;
  activo: boolean;
}

export function useFuentesDatos() {
  return useQuery<FuenteDatos[]>({
    queryKey: ['fuentes-datos'],
    queryFn: async () => {
      const res = await api.get('/catalogos/fuentes');
      return res.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}