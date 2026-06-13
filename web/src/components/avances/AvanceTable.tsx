import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search, MoreVertical, Pencil, Trash2, ChevronLeft, ChevronRight, Activity, Filter, X,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import type { AvanceEntity } from '@/types/avance';
import { MESES } from '@/types/avance';

interface Props {
  data: AvanceEntity[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  search: string;
  anioFilter: string;
  mesFilter: string;
  onSearchChange: (v: string) => void;
  onAnioFilterChange: (v: string) => void;
  onMesFilterChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onEdit: (a: AvanceEntity) => void;
  onDelete: (a: AvanceEntity) => void;
  canEdit: boolean;
  isAdmin: boolean;
}

export function AvanceTable({
  data, isLoading, total, page, limit, search, anioFilter, mesFilter,
  onSearchChange, onAnioFilterChange, onMesFilterChange,
  onPageChange, onLimitChange, onEdit, onDelete, canEdit, isAdmin,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilters = anioFilter !== '__all__' || mesFilter !== '__all__';
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const getBadgeColor = (pct: number) => {
    if (pct >= 100) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (pct >= 75) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (pct >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar POI, entidad, observaciones..."
              className="pl-9 h-10"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={anioFilter} onValueChange={onAnioFilterChange}>
              <SelectTrigger className="w-30 h-10">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los años</SelectItem>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={mesFilter} onValueChange={onMesFilterChange}>
              <SelectTrigger className="w-37.5 h-10">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los meses</SelectItem>
                {MESES.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { onAnioFilterChange('__all__'); onMesFilterChange('__all__'); }}
                className="h-10 text-xs text-red-600"
              >
                <X className="w-3 h-3 mr-1" /> Limpiar
              </Button>
            )}
          </div>
        </div>

        {total > 0 && (
          <p className="text-xs text-gray-500">
            Mostrando {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} de {total} avances
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold">Período</TableHead>
              <TableHead className="font-semibold">Actividad (POI)</TableHead>
              <TableHead className="font-semibold">Entidad</TableHead>
              <TableHead className="text-right font-semibold">Programada</TableHead>
              <TableHead className="text-right font-semibold">Ejecutada</TableHead>
              <TableHead className="w-30 font-semibold text-center">% Avance</TableHead>
              {canEdit && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 7 : 6} className="text-center py-8 text-gray-500">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 7 : 6} className="p-0">
                  <EmptyState
                    icon={Activity}
                    title="Sin avances registrados"
                    description="Registra el primer avance físico mensual"
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map(a => {
                const pct = a.porcentaje_avance || 0;
                return (
                  <TableRow key={a.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="text-sm font-semibold text-gray-900">{a.mes_nombre}</div>
                      <div className="text-xs text-gray-500">{a.anio}</div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.poi_nombre}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs font-mono text-purple-600">{a.poi_codigo}</span>
                        {a.poi_area_responsable && (
                          <span className="text-xs text-gray-500">• {a.poi_area_responsable}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 truncate max-w-37.5">
                      {a.entidad_nombre || '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-gray-700">
                      {a.meta_programada.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums text-gray-900">
                      {a.meta_ejecutada.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`${getBadgeColor(pct)} font-bold`}>
                        {pct.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(a)} className="cursor-pointer">
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            {isAdmin && (
                              <DropdownMenuItem
                                onClick={() => onDelete(a)}
                                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Filas por página:</span>
            <Select value={limit.toString()} onValueChange={(v) => onLimitChange(parseInt(v))}>
              <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium">{page} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}