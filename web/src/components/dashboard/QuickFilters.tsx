import { Button } from '@/components/ui/button';
import { Calendar, CalendarRange, GitCompare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardFilters } from '@/hooks/useDashboard';

interface QuickFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: Partial<DashboardFilters>) => void;
}

export function QuickFilters({ filters, onFiltersChange }: QuickFiltersProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3) as 1 | 2 | 3 | 4;

  const isThisMonth = filters.mes === currentMonth && filters.anio === currentYear;
  const isCurrentQuarter = filters.trimestre === `Q${currentQuarter}` && filters.anio === currentYear;
  const isComparing = filters.compararAnioAnterior === true;

  const quickActions = [
    {
      id: 'this-month',
      label: 'Este mes',
      icon: Calendar,
      active: isThisMonth,
      onClick: () =>
        onFiltersChange({
          mes: currentMonth,
          anio: currentYear,
          trimestre: 'all',
        }),
    },
    {
      id: 'current-quarter',
      label: `Q${currentQuarter} actual`,
      icon: CalendarRange,
      active: isCurrentQuarter,
      onClick: () =>
        onFiltersChange({
          trimestre: `Q${currentQuarter}` as 'Q1' | 'Q2' | 'Q3' | 'Q4',
          anio: currentYear,
          mes: 'all',
        }),
    },
    {
      id: 'compare',
      label: `Comparar con ${filters.anio - 1}`,
      icon: GitCompare,
      active: isComparing,
      onClick: () =>
        onFiltersChange({
          compararAnioAnterior: !isComparing,
        }),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-gray-500 mr-1">Rápido:</span>
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            variant={action.active ? 'default' : 'outline'}
            size="sm"
            onClick={action.onClick}
            className={cn(
              'h-8 text-xs font-medium gap-1.5',
              action.active
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100 border-gray-200'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}