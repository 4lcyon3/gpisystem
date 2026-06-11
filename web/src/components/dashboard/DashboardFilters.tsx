/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Building2, RefreshCw, X, Filter, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { QuickFilters } from './QuickFilters';
import { FilterPresets } from './FilterPresets';
import { AdvancedFiltersPanel } from './AdvancedFiltersPanel';
import type {
  DashboardFilters as DashboardFiltersType,
  Entidad,
  ClasificadorGasto,
} from '@/hooks/useDashboard';

interface DashboardFiltersProps {
  filters: DashboardFiltersType;
  onFiltersChange: (filters: Partial<DashboardFiltersType>) => void;
  onClearAll: () => void;
  entidades: Entidad[];
  clasificadores: ClasificadorGasto[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

const TRIMESTRES = [
  { value: 'all', label: 'Año completo' },
  { value: 'Q1', label: 'Q1 (Ene-Mar)' },
  { value: 'Q2', label: 'Q2 (Abr-Jun)' },
  { value: 'Q3', label: 'Q3 (Jul-Sep)' },
  { value: 'Q4', label: 'Q4 (Oct-Dic)' },
];

const MESES_NOMBRES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function DashboardFilters({
  filters,
  onFiltersChange,
  onClearAll,
  entidades,
  clasificadores,
  onRefresh,
  isRefreshing,
}: DashboardFiltersProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const countActiveFilters = () => {
    let count = 0;
    if (filters.trimestre && filters.trimestre !== 'all') count++;
    if (filters.mes && filters.mes !== 'all') count++;
    if (filters.clasificador_id) count++;
    if (filters.fases && filters.fases.length > 0) count++;
    if (filters.compararAnioAnterior) count++;
    return count;
  };

  const activeCount = countActiveFilters();
  const hasAnyFilter = activeCount > 0 || filters.entidad_id !== 'todas';

  const entidadOptions = entidades.map((e) => ({
    value: e.id,
    label: e.nombre,
    badge: e.ruc,
  }));

  const getActiveFilterPills = () => {
    const pills: { id: string; label: string; color: string; onRemove: () => void }[] = [];

    if (filters.entidad_id && filters.entidad_id !== 'todas') {
      const ent = entidades.find((e) => e.id === filters.entidad_id);
      if (ent) {
        pills.push({
          id: 'entidad',
          label: ent.nombre,
          color: 'blue',
          onRemove: () => onFiltersChange({ entidad_id: 'todas' }),
        });
      }
    }

    if (filters.trimestre && filters.trimestre !== 'all') {
      pills.push({
        id: 'trimestre',
        label: filters.trimestre,
        color: 'purple',
        onRemove: () => onFiltersChange({ trimestre: 'all' }),
      });
    }

    if (filters.mes && filters.mes !== 'all') {
      pills.push({
        id: 'mes',
        label: MESES_NOMBRES[filters.mes as number],
        color: 'indigo',
        onRemove: () => onFiltersChange({ mes: 'all' }),
      });
    }

    if (filters.clasificador_id) {
      const clas = clasificadores.find((c) => c.id === filters.clasificador_id);
      if (clas) {
        pills.push({
          id: 'clasificador',
          label: clas.descripcion,
          color: 'amber',
          onRemove: () => onFiltersChange({ clasificador_id: undefined }),
        });
      }
    }

    if (filters.fases && filters.fases.length > 0) {
      pills.push({
        id: 'fases',
        label: `${filters.fases.length} fase(s)`,
        color: 'pink',
        onRemove: () => onFiltersChange({ fases: undefined }),
      });
    }

    if (filters.compararAnioAnterior) {
      pills.push({
        id: 'comparar',
        label: `vs ${filters.anio - 1}`,
        color: 'rose',
        onRemove: () => onFiltersChange({ compararAnioAnterior: false }),
      });
    }

    return pills;
  };

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200',
    purple: 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200',
    indigo: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200',
    amber: 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200',
    pink: 'bg-pink-100 text-pink-800 hover:bg-pink-200 border-pink-200',
    rose: 'bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200',
  };

  const pills = getActiveFilterPills();

  return (
    <div className="mb-6 space-y-3">
      {/* Toolbar principal */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-900">Filtros de Análisis</h2>
                {activeCount > 0 && (
                  <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0 h-4 font-bold">
                    {activeCount}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500">Personaliza la vista del dashboard</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center flex-1 lg:justify-end">
            {/* Año */}
            <Select
              value={filters.anio.toString()}
              onValueChange={(v) => onFiltersChange({ anio: parseInt(v) })}
            >
              <SelectTrigger className="w-38 h-10 font-medium bg-gray-50 hover:bg-gray-100 border-gray-200">
                <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-32.5">
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    <div className="flex items-center gap-2">
                      <span>Año {y}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Trimestre */}
            <Select
              value={filters.trimestre || 'all'}
              onValueChange={(v) => onFiltersChange({ trimestre: v as any, mes: 'all' })}
            >
              <SelectTrigger
                className={cn(
                  'w-45 h-10 font-medium border-gray-200',
                  filters.trimestre && filters.trimestre !== 'all'
                    ? 'bg-purple-50 border-purple-200 text-purple-900'
                    : 'bg-gray-50 hover:bg-gray-100'
                )}
              >
                <CalendarRange className="w-4 h-4 mr-2 text-indigo-600" />
                <SelectValue placeholder="Trimestre" />
              </SelectTrigger>
              <SelectContent>
                {TRIMESTRES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Entidad */}
            <SearchableSelect
              options={entidadOptions}
              value={filters.entidad_id || 'all'}
              onChange={(v) => onFiltersChange({ entidad_id: v })}
              placeholder="Entidad"
              searchPlaceholder="Buscar entidad..."
              emptyText="No se encontraron entidades"
              icon={<Building2 className="w-4 h-4" />}
              showAll
              allLabel="Todas las entidades"
              className="w-full sm:w-60"
            />

            <Button
              variant="outline"
              size={isRefreshing ? 'default' : 'icon'}
              onClick={onRefresh}
              disabled={isRefreshing}
              className={cn(
                'h-10 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all',
                isRefreshing ? 'px-4 gap-2' : 'w-10'
              )}
              title="Actualizar datos"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
              {isRefreshing && (
                <span className="text-sm font-medium">Actualizando</span>
              )}
            </Button>

            <FilterPresets onApplyPreset={onFiltersChange} currentYear={currentYear} />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <QuickFilters filters={filters} onFiltersChange={onFiltersChange} />
        </div>

        <AdvancedFiltersPanel
          open={advancedOpen}
          onOpenChange={setAdvancedOpen}
          filters={filters}
          onFiltersChange={onFiltersChange}
          clasificadores={clasificadores}
          activeCount={activeCount}
        />
      </div>

      {/* Pills de filtros activos */}
      {pills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-xs font-semibold text-gray-500 mr-1">Activos:</span>
          {pills.map((pill) => (
            <Badge
              key={pill.id}
              variant="outline"
              className={cn(
                'cursor-pointer py-1 px-3 text-xs font-medium gap-1.5 border transition-colors',
                colorMap[pill.color]
              )}
              onClick={pill.onRemove}
            >
              <span className="truncate max-w-37.5">{pill.label}</span>
              <X className="w-3 h-3 shrink-0" />
            </Badge>
          ))}
          {hasAnyFilter && (
            <button
              onClick={onClearAll}
              className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline ml-2"
            >
              Limpiar todo
            </button>
          )}
        </div>
      )}
    </div>
  );
}