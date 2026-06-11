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
  DollarSign,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { PresupuestoEntity } from '@/types/presupuesto';
import { EmptyState } from '@/components/ui/empty-state';

interface PresupuestoTableProps {
  data: PresupuestoEntity[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  search: string;
  onSearchChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onSort: (col: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onView: (p: PresupuestoEntity) => void;
  onEdit: (p: PresupuestoEntity) => void;
  onDelete: (p: PresupuestoEntity) => void;
  canEdit: boolean;
}

export function PresupuestoTable({
  data, isLoading, total, page, limit, search,
  onSearchChange, onPageChange, onLimitChange, onSort,
  sortBy, sortOrder, onView, onEdit, onDelete, canEdit,
}: PresupuestoTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
      : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />;
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getPctEjecucion = (pia: number, mod: number) => {
    if (pia === 0) return 0;
    return ((mod / pia) * 100);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por entidad, clasificador, centro de costo..."
              className="pl-9 h-9"
            />
          </div>
        </div>
        {total > 0 && (
          <p className="text-xs text-gray-500">
            Mostrando {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} de {total} registros
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-gray-50/50">
              <TableHead className="font-semibold">Entidad</TableHead>
              <TableHead className="font-semibold cursor-pointer select-none" onClick={() => onSort('anio_fiscal')}>
                <div className="flex items-center gap-1.5">Año <SortIcon col="anio_fiscal" /></div>
              </TableHead>
              <TableHead className="font-semibold">Centro Costo</TableHead>
              <TableHead className="font-semibold">Clasificador</TableHead>
              <TableHead className="font-semibold">Fuente</TableHead>
              <TableHead className="font-semibold cursor-pointer select-none text-right" onClick={() => onSort('pia')}>
                <div className="flex items-center justify-end gap-1.5">PIA <SortIcon col="pia" /></div>
              </TableHead>
              <TableHead className="font-semibold cursor-pointer select-none text-right" onClick={() => onSort('pim')}>
                <div className="flex items-center justify-end gap-1.5">PIM <SortIcon col="pim" /></div>
              </TableHead>
              <TableHead className="font-semibold text-center">Modif.</TableHead>
              {canEdit && <TableHead className="w-12 text-right font-semibold">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: canEdit ? 8 : 7 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 8 : 7} className="p-0">
                  <EmptyState
                    icon={DollarSign}
                    title="No hay presupuestos registrados"
                    description={search ? 'No se encontraron resultados' : 'Comienza creando el primer presupuesto'}
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map((p) => {
                const pctMod = getPctEjecucion(p.pia, p.modificaciones_acumuladas);
                return (
                  <TableRow key={p.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-50">
                          {p.entidad_nombre || '—'}
                        </p>
                        {p.poi_nombre && (
                          <p className="text-xs text-blue-600 truncate max-w-50">{p.poi_nombre}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded">
                        {p.anio_fiscal}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      <p className="font-mono text-xs text-gray-500">{p.centro_costo_nombre || '—'}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      <p className="font-mono text-xs text-purple-700">{p.clasificador_codigo || '—'}</p>
                      <p className="text-xs text-gray-500 truncate max-w-37.5">
                        {p.clasificador_descripcion || '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200 font-mono text-xs">
                        {p.fuente_datos_nombre || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900 tabular-nums">
                      {formatCurrency(p.pia)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-blue-700 tabular-nums">
                      {formatCurrency(p.pim)}
                    </TableCell>
                    <TableCell className="text-center">
                      {p.modificaciones_acumuladas > 0 ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-semibold">
                          {pctMod.toFixed(1)}%
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
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
                            <DropdownMenuItem onClick={() => onView(p)} className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" /> Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(p)} className="cursor-pointer">
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(p)}
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
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                ))}
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