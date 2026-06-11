import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload,
  CheckCircle2,
  XCircle,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import type { Carga } from '@/hooks/useCargas';
import { cn } from '@/lib/utils';

interface CargasStatsCardsProps {
  cargas: Carga[] | undefined;
  isLoading: boolean;
}

interface StatConfig {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  getValue: (cargas: Carga[]) => number;
}

const stats: StatConfig[] = [
  {
    label: 'Total Cargas',
    icon: Upload,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    getValue: (c) => c.length,
  },
  {
    label: 'Exitosas',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    getValue: (c) => c.filter((x) => x.estado === 'procesado').length,
  },
  {
    label: 'Con Errores',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    getValue: (c) => c.filter((x) => x.estado === 'error').length,
  },
  {
    label: 'En Proceso',
    icon: Loader2,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    getValue: (c) =>
      c.filter((x) => x.estado === 'pendiente' || x.estado === 'procesando')
        .length,
  },
];

export function CargasStatsCards({ cargas, isLoading }: CargasStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-gray-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const data = cargas || [];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const value = stat.getValue(data);
        return (
          <Card
            key={stat.label}
            className="border-gray-200 hover:shadow-md transition-shadow"
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                    stat.bgColor
                  )}
                >
                  <Icon className={cn('w-5 h-5', stat.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 truncate">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums mt-0.5">
                    {value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}