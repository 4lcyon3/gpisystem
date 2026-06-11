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
  Target,
  Building2,
  X,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PeiEntity } from '@/types/pei';
import { EmptyState } from '@/components/ui/empty-state';

interface PeiTableProps {
  data: PeiEntity[];
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
  onView: (p: PeiEntity) => void;
  onEdit: (p: PeiEntity) => void;
  onDelete: (p: PeiEntity) => void;
  canEdit: boolean;
  entidadOptions: { id: string; nombre: string; ruc: string }[];
}

const estadoConfig: Record<string, { label: string; color: string }> = {
  vigente: { label: 'Vigente', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  modificado: { label: 'Modificado', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  archivado: { label: 'Archivado', color: 'bg-gray-100 text-gray-600 border-gray-300' },
};

export function PeiTable({
  data, isLoading, total, page, limit, search, entidadFilter,
  onSearchChange, onEntidadFilterChange,
  onPageChange, onLimitChange, onSort,
  sortBy, sortOrder, onView, onEdit, onDelete, canEdit, entidadOptions,
}: PeiTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
      : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />;
  };

  const colSpan = canEdit ? 6 : 5;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por código, descripción..."
              className="pl-9 h-9"
            />
          </div>

          {/* ✅ NUEVO: Filtro de entidad */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <Select value={entidadFilter} onValueChange={onEntidadFilterChange}>
              <SelectTrigger className="w-55 h-9">
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
                className="h-9 text-xs text-red-600 hover:bg-red-50"
              >
                <X className="w-3 h-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {total > 0 && (
          <p className="text-xs text-gray-500">
            Mostrando {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} de {total} objetivos
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-gray-50/50">
              <TableHead className="font-semibold cursor-pointer select-none" onClick={() => onSort('codigo_objetivo')}>
                <div className="flex items-center gap-1.5">Código <SortIcon col="codigo_objetivo" /></div>
              </TableHead>
              <TableHead className="font-semibold cursor-pointer select-none" onClick={() => onSort('descripcion')}>
                <div className="flex items-center gap-1.5">Descripción <SortIcon col="descripcion" /></div>
              </TableHead>
              <TableHead className="font-semibold">Área Responsable</TableHead>
              <TableHead className="font-semibold cursor-pointer select-none" onClick={() => onSort('vigencia_inicio')}>
                <div className="flex items-center gap-1.5">Vigencia <SortIcon col="vigencia_inicio" /></div>
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
                    icon={Target}
                    title="No hay objetivos estratégicos"
                    description={search || entidadFilter !== '__all__' ? 'No se encontraron resultados' : 'Comienza creando el primer objetivo'}
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map((pei) => {
                const est = estadoConfig[pei.estado];
                return (
                  <TableRow key={pei.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {pei.codigo_objetivo}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-gray-900">{pei.descripcion}</TableCell>
                    <TableCell className="text-sm text-gray-600">{pei.area_responsable || '—'}</TableCell>
                    <TableCell className="text-xs text-gray-600">
                      <div>{format(new Date(pei.vigencia_inicio), 'd MMM yyyy', { locale: es })}</div>
                      <div className="text-gray-400">al {format(new Date(pei.vigencia_fin), 'd MMM yyyy', { locale: es })}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={est.color}>{est.label}</Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(pei)} className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" /> Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(pei)} className="cursor-pointer">
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(pei)}
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