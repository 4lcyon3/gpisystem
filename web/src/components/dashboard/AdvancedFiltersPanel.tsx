import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Layers, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { DashboardFilters, ClasificadorGasto } from '@/hooks/useDashboard';

interface AdvancedFiltersPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: DashboardFilters;
  onFiltersChange: (filters: Partial<DashboardFilters>) => void;
  clasificadores: ClasificadorGasto[];
  activeCount: number;
}

const MESES = [
  { value: 1, label: 'Ene' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dic' },
];

const FASES = [
  { value: 'certificado', label: 'Certificado', color: 'bg-blue-500' },
  { value: 'comprometido', label: 'Comprometido', color: 'bg-purple-500' },
  { value: 'devengado', label: 'Devengado', color: 'bg-emerald-500' },
  { value: 'girado', label: 'Girado', color: 'bg-amber-500' },
];

export function AdvancedFiltersPanel({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  clasificadores,
  activeCount,
}: AdvancedFiltersPanelProps) {
  const handleFaseToggle = (fase: string, checked: boolean) => {
    const currentFases = filters.fases || [];
    const newFases = checked
      ? [...currentFases, fase]
      : currentFases.filter((f) => f !== fase);
    onFiltersChange({ fases: newFases.length > 0 ? newFases : undefined });
  };

  const handleMesSelect = (mes: string) => {
    onFiltersChange({
      mes: mes === 'all' ? 'all' : parseInt(mes),
      trimestre: 'all',
    });
  };

  const clasificadorOptions = clasificadores.map((c) => ({
    value: c.id,
    label: c.descripcion,
    badge: c.codigo,
  }));

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="mt-3">
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors group">
          <Layers className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
          <span>Filtros avanzados</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0 h-4">
              {activeCount}
            </Badge>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3">
        <div className="bg-linear-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-5 space-y-5 shadow-sm">
          {/* Fila 1: Meses */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Mes Específico
            </label>
            <div className="flex flex-wrap gap-1.5">
              {MESES.map((m) => {
                const isActive = filters.mes === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => handleMesSelect(isActive ? 'all' : m.value.toString())}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fila 2: Fases del Gasto */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Fases del Gasto
            </label>
            <div className="flex flex-wrap gap-2">
              {FASES.map((fase) => {
                const isChecked = filters.fases?.includes(fase.value) || false;
                return (
                  <label
                    key={fase.value}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all',
                      isChecked
                        ? 'bg-white border-blue-300 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => handleFaseToggle(fase.value, checked as boolean)}
                    />
                    <div className={cn('w-2 h-2 rounded-full', fase.color)} />
                    <span className="text-sm font-medium text-gray-700">{fase.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Fila 3: Solo Clasificador */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                Clasificador de Gasto
              </label>
              <SearchableSelect
                options={clasificadorOptions}
                value={filters.clasificador_id || 'all'}
                onChange={(v) => onFiltersChange({ clasificador_id: v === 'all' ? undefined : v })}
                placeholder="Todos los clasificadores"
                searchPlaceholder="Buscar clasificador..."
                emptyText="No se encontraron clasificadores"
                showAll
                allLabel="Todos los clasificadores"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}