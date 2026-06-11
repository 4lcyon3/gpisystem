/* eslint-disable react-hooks/static-components */
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Target,
  Building2,
  X,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PoiEntity } from '@/types/poi';
import { EmptyState } from '@/components/ui/empty-state';

interface PoiTableProps {
  data: PoiEntity[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  search: string;
  entidadFilter: string;
  onSearchChange: (v: string) => void;
  onEntidadFilterChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onSort: (col: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onView: (p: PoiEntity) => void;
  onEdit: (p: PoiEntity) => void;
  onDelete: (p: PoiEntity) => void;
  canEdit: boolean;
  entidadOptions: { id: string; nombre: string; ruc: string }[];
}

const estadoConfig: Record<string, { label: string; color: string }> = {
  programada: { label: 'Programada', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  en_ejecucion: { label: 'En Ejecución', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  completada: { label: 'Completada', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600 border-gray-300' },
};

export function PoiTable({
  data, isLoading, total, page, limit, search, entidadFilter,
  onSearchChange, onEntidadFilterChange,
  onPageChange, onLimitChange, onSort,
  sortBy, sortOrder, onView, onEdit, onDelete, canEdit, entidadOptions,
}: PoiTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
      : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />;
  };

  const formatCurrency = (v: number | undefined) => {
    if (!v) return '—';
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0 }).format(v);
  };

  const colSpan = canEdit ? 7 : 6;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por código, nombre, responsable..."
              className="pl-9 h-9"
            />
          </div>

          {/* ✅ NUEVO: Filtro de entidad */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
            <Select value={entidadFilter} onValueChange={onEntidadFilterChange}>
              <SelectTrigger className="w-full lg:w-55 h-9">
                <SelectValue placeholder="Todas las entidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las entidades</SelectItem>
                {entidadOptions.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{e.nombre}</span>
                      <span className="text-[10px] font-mono text-gray-400">{e.ruc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {entidadFilter !== '__all__' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEntidadFilterChange('__all__')}
                className="h-9 text-xs text-red-600 hover:bg-red-50 shrink-0"
              >
                <X className="w-3 h-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {total > 0 && (
          <p className="text-xs text-gray-500">
            Mostrando {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} de {total} actividades
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-gray-50/50">
              <TableHead className="font-semibold cursor-pointer select-none" onClick={() => onSort('codigo_actividad')}>
                <div className="flex items-center gap-1.5">Código <SortIcon col="codigo_actividad" /></div>
              </TableHead>
              <TableHead className="font-semibold">Actividad / PEI</TableHead>
              <TableHead className="font-semibold">Responsable</TableHead>
              <TableHead className="font-semibold cursor-pointer select-none text-right" onClick={() => onSort('presupuesto_estimado')}>
                <div className="flex items-center justify-end gap-1.5">Presupuesto <SortIcon col="presupuesto_estimado" /></div>
              </TableHead>
              <TableHead className="font-semibold cursor-pointer select-none" onClick={() => onSort('fecha_inicio')}>
                <div className="flex items-center gap-1.5">Vigencia <SortIcon col="fecha_inicio" /></div>
              </TableHead>
              <TableHead className="font-semibold cursor-pointer select-none" onClick={() => onSort('estado')}>
                <div className="flex items-center gap-1.5">Estado <SortIcon col="estado" /></div>
              </TableHead>
              {canEdit && <TableHead className="w-12 text-right font-semibold">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: colSpan }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="p-0">
                  <EmptyState
                    icon={ListTodo}
                    title="No hay actividades operativas"
                    description={search || entidadFilter !== '__all__' ? 'No se encontraron resultados' : 'Comienza creando la primera actividad'}
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map((poi) => {
                const est = estadoConfig[poi.estado];
                return (
                  <TableRow key={poi.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {poi.codigo_actividad}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm font-medium text-gray-900 truncate">{poi.nombre}</p>
                      {poi.pei_codigo && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Target className="w-3 h-3 text-blue-500" />
                          <span className="text-xs text-blue-600 font-mono">{poi.pei_codigo}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <div>{poi.area_responsable || '—'}</div>
                      {poi.responsable_directo && <p className="text-xs text-gray-500">{poi.responsable_directo}</p>}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold text-gray-900 tabular-nums">
                      {formatCurrency(poi.presupuesto_estimado)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      <div>{format(new Date(poi.fecha_inicio), 'd MMM yyyy', { locale: es })}</div>
                      <div className="text-gray-400">al {format(new Date(poi.fecha_fin), 'd MMM yyyy', { locale: es })}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={est.color}>{est.label}</Badge></TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(poi)} className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" /> Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(poi)} className="cursor-pointer">
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(poi)}
                              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
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
                {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
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