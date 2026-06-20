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
  Search, MoreVertical, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Calendar, Filter, X, CheckCircle,
  Archive, RotateCcw,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import type { ProgramacionEntity } from '@/types/programacion';
import { TIPOS_PROGRAMACION, ESTADOS_PROGRAMACION } from '@/types/programacion';

interface Props {
  data: ProgramacionEntity[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  search: string;
  tipoFilter: string;
  estadoFilter: string;
  onSearchChange: (v: string) => void;
  onTipoFilterChange: (v: string) => void;
  onEstadoFilterChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onView: (p: ProgramacionEntity) => void;
  onEdit: (p: ProgramacionEntity) => void;
  onAprobar: (p: ProgramacionEntity) => void;
  onDelete: (p: ProgramacionEntity) => void;
  canEdit: boolean;
  isAdmin: boolean;
  onArchivar: (p: ProgramacionEntity) => void;
  onRestaurar: (p: ProgramacionEntity) => void;
}

const TIPOS_LABELS: Record<string, string> = {
  proyecto: 'Proyecto',
  actividad: 'Actividad',
  inversion: 'Inversión',
  servicio: 'Servicio',
};

const ESTADOS_CONFIG: Record<string, { label: string; color: string }> = {
  borrador: { label: 'Borrador', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  aprobado: { label: 'Aprobado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  archivado: { label: 'Archivado', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export function ProgramacionTable({
  data, isLoading, total, page, limit, search, tipoFilter, estadoFilter,
  onSearchChange, onTipoFilterChange, onEstadoFilterChange,
  onPageChange, onLimitChange, onView, onEdit, onAprobar, onDelete, canEdit, isAdmin, onArchivar, onRestaurar,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilters = tipoFilter !== '__all__' || estadoFilter !== '__all__';

  const formatCurrency = (v: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v || 0);
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
              placeholder="Buscar por nombre, entidad..."
              className="pl-9 h-10"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            
            <Select value={tipoFilter} onValueChange={onTipoFilterChange}>
              <SelectTrigger className="w-40 h-10">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los tipos</SelectItem>
                {TIPOS_PROGRAMACION.map(t => (
                  <SelectItem key={t} value={t}>{TIPOS_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={estadoFilter} onValueChange={onEstadoFilterChange}>
              <SelectTrigger className="w-37.5 h-10">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los estados</SelectItem>
                {ESTADOS_PROGRAMACION.map(e => (
                  <SelectItem key={e} value={e}>{ESTADOS_CONFIG[e].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { onTipoFilterChange('__all__'); onEstadoFilterChange('__all__'); }}
                className="h-10 text-xs text-red-600"
              >
                <X className="w-3 h-3 mr-1" /> Limpiar
              </Button>
            )}
          </div>
        </div>

        {total > 0 && (
          <p className="text-xs text-gray-500">
            Mostrando {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} de {total} programaciones
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold">Nombre</TableHead>
              <TableHead className="font-semibold">Entidad</TableHead>
              <TableHead className="w-30 font-semibold text-center">Período</TableHead>
              <TableHead className="w-37.5 font-semibold text-right">Monto Total</TableHead>
              <TableHead className="w-30 font-semibold">Estado</TableHead>
              {canEdit && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 6 : 5} className="text-center py-8 text-gray-500">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 6 : 5} className="p-0">
                  <EmptyState
                    icon={Calendar}
                    title="Sin programaciones"
                    description="Cree la primera programación multianual"
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map(p => {
                const est = ESTADOS_CONFIG[p.estado];
                const isBorrador = p.estado === 'borrador';
                return (
                  <TableRow key={p.id} className="hover:bg-gray-50/50">
                    <TableCell className="max-w-xs">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.nombre}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{TIPOS_LABELS[p.tipo]}</p>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 truncate max-w-37.5">
                      {p.entidad_nombre || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm font-semibold text-gray-900">
                        {p.anio_inicio} - {p.anio_fin}
                      </div>
                      <div className="text-xs text-gray-500">{p.cantidad_anios} años</div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900 tabular-nums">
                      {formatCurrency(p.monto_total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={est.color}>
                        {est.label}
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
                            <DropdownMenuItem onClick={() => onView(p)} className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" /> Ver detalles
                            </DropdownMenuItem>
                            {isBorrador && (
                              <>
                                <DropdownMenuItem onClick={() => onEdit(p)} className="cursor-pointer">
                                  <Pencil className="w-4 h-4 mr-2" /> Editar
                                </DropdownMenuItem>
                                {isAdmin && (
                                  <DropdownMenuItem onClick={() => onAprobar(p)} className="cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">
                                    <CheckCircle className="w-4 h-4 mr-2" /> Aprobar
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            {isAdmin && p.estado === 'aprobado' && (
                              <DropdownMenuItem 
                                onClick={() => onArchivar(p)} 
                                className="cursor-pointer text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                              >
                                <Archive className="w-4 h-4 mr-2" /> Archivar
                              </DropdownMenuItem>
                            )}
                            {isAdmin && p.estado === 'archivado' && (
                              <DropdownMenuItem 
                                onClick={() => onRestaurar(p)} 
                                className="cursor-pointer text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" /> Restaurar
                              </DropdownMenuItem>
                            )}
                            {isAdmin && isBorrador && (
                              <DropdownMenuItem
                                onClick={() => onDelete(p)}
                                className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
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