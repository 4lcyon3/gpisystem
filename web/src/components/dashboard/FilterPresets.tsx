import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bookmark, Sparkles, AlertTriangle, Target, TrendingUp } from 'lucide-react';
import type { DashboardFilters } from '@/hooks/useDashboard';

interface FilterPresetsProps {
  onApplyPreset: (filters: Partial<DashboardFilters>) => void;
  currentYear: number;
}

const PRESETS = [
  {
    id: 'executive',
    label: 'Vista Ejecutiva',
    description: 'Resumen general del año actual',
    icon: Sparkles,
    filters: {
      trimestre: 'all' as const,
      mes: 'all' as const,
      compararAnioAnterior: true,
    },
  },
  {
    id: 'critical',
    label: 'Solo Alertas Críticas',
    description: 'Enfocado en problemas',
    icon: AlertTriangle,
    filters: {
      trimestre: 'all' as const,
      mes: 'all' as const,
    },
  },
  {
    id: 'execution',
    label: 'Análisis de Ejecución',
    description: 'Fases devengado y girado',
    icon: Target,
    filters: {
      fases: ['devengado', 'girado'],
      trimestre: 'all' as const,
      mes: 'all' as const,
    },
  },
  {
    id: 'quarterly',
    label: 'Trimestre Actual',
    description: 'Análisis del Q en curso',
    icon: TrendingUp,
    filters: {
      trimestre: `Q${Math.ceil((new Date().getMonth() + 1) / 3)}` as 'Q1' | 'Q2' | 'Q3' | 'Q4',
      mes: 'all' as const,
    },
  },
];

export function FilterPresets({ onApplyPreset, currentYear }: FilterPresetsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 gap-1.5 font-medium border-gray-200 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700"
        >
          <Bookmark className="w-4 h-4" />
          <span className="hidden sm:inline">Vistas</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Vistas Predefinidas
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <DropdownMenuItem
              key={preset.id}
              onClick={() => onApplyPreset({ anio: currentYear, ...preset.filters })}
              className="cursor-pointer flex items-start gap-3 p-3"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{preset.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{preset.description}</p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}