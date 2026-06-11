import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';
import type { RankingEntidad } from '@/hooks/useDashboard';

interface RankingEntidadesTableProps {
  data: RankingEntidad[] | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function RankingEntidadesTable({ data, isLoading }: RankingEntidadesTableProps) {
  if (isLoading) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Top 10 Entidades por Ejecución
          </CardTitle>
          <CardDescription>Entidades con mayor porcentaje de ejecución</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-75 text-gray-400 text-sm">
            No hay datos de ejecución disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          Top 10 Entidades por Ejecución
        </CardTitle>
        <CardDescription>Entidades con mayor porcentaje de ejecución</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((entidad, index) => {
            const porcentaje = Number(entidad.porcentaje) || 0;
            const getProgressColor = (pct: number) => {
              if (pct >= 75) return 'bg-emerald-500';
              if (pct >= 50) return 'bg-blue-500';
              if (pct >= 25) return 'bg-amber-500';
              return 'bg-red-500';
            };

            return (
              <div key={entidad.ruc} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs font-bold text-gray-400 w-5">#{index + 1}</span>
                    <span className="font-medium text-gray-900 truncate">
                      {entidad.entidad_nombre}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      {formatCurrency(Number(entidad.devengado))}
                    </span>
                    <span className="text-sm font-bold text-gray-900 tabular-nums w-12 text-right">
                      {porcentaje.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all ${getProgressColor(porcentaje)}`}
                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}