/* eslint-disable @typescript-eslint/no-explicit-any */
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
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowRightLeft,
  Filter,
  X,
  Building2,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ModificacionEntity } from '@/types/modificacion';
import { TIPOS_MODIFICACION, ESTADOS_MODIFICACION } from '@/types/modificacion';
import { EmptyState } from '@/components/ui/empty-state';
import { ExportButton } from '@/components/ui/export-button';
import { FileText } from 'lucide-react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { SearchableSelect, type SelectOption } from '@/components/ui/searchable-select';

interface ModificacionTableProps {
  data: ModificacionEntity[];
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
  onSort: (col: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onView: (m: ModificacionEntity) => void;
  onEdit: (m: ModificacionEntity) => void;
  onDelete: (m: ModificacionEntity) => void;
  canEdit: boolean;
  canDelete: boolean;
  entidadFilter: string;
  onEntidadFilterChange: (v: string) => void;
  anioFilter: string;
  onAnioFilterChange: (v: string) => void;
  entidadOptions: SelectOption[];
  exportFilters?: Record<string, any>; 
}

const TIPOS_CONFIG: Record<string, { label: string; icon: typeof TrendingUp; color: string; bg: string }> = {
  Habilitacion: { label: 'Habilitación', icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  Anulacion: { label: 'Anulación', icon: TrendingDown, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  'Credito Suplementario': { label: 'Crédito Sup.', icon: DollarSign, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  Transferencia: { label: 'Transferencia', icon: ArrowRightLeft, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
};

const ESTADOS_CONFIG: Record<string, { label: string; color: string }> = {
  aprobada: { label: 'Aprobada', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pendiente: { label: 'Pendiente', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  anulada: { label: 'Anulada', color: 'bg-gray-100 text-gray-600 border-gray-300' },
};

export function ModificacionTable({
  data, isLoading, total, page, limit, search,
  tipoFilter, estadoFilter,
  onSearchChange, onTipoFilterChange, onEstadoFilterChange,
  onPageChange, onLimitChange, onSort,
  sortBy, sortOrder, onView, onEdit, onDelete, canEdit, canDelete, exportFilters,
  entidadFilter, onEntidadFilterChange, anioFilter, onAnioFilterChange, entidadOptions,
}: ModificacionTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
      : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const handleDownloadPdf = async (mod: ModificacionEntity) => {
    try {
      const response = await api.get(`/reportes/modificaciones/${mod.id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Resolucion_${mod.numero_resolucion}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF de resolución descargado');
    } catch (error) {
      toast.error('Error al generar el PDF: ' + error);
    }
  };

  const hasFilters = tipoFilter || estadoFilter;
  const colSpan = (canEdit ? 1 : 0) + 7;

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
              placeholder="Buscar por resolución, descripción o entidad..."
              className="pl-9 h-12"
            />
          </div>
          <div className="w-full lg:w-[320px]">
          <SearchableSelect
            options={entidadOptions}
            value={entidadFilter}
            onChange={onEntidadFilterChange}
            placeholder="Filtrar por entidad"
            searchPlaceholder="Buscar entidad..."
            icon={<Building2 className="w-4 h-4" />}
            clearable={false}
            showCount
          />
          </div>


          <div className="flex gap-2 items-center">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={anioFilter} onValueChange={onAnioFilterChange}>
              <SelectTrigger className="w-30 h-9">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los años</SelectItem>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={onTipoFilterChange}>
              <SelectTrigger className="w-45 h-9">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los tipos</SelectItem>
                {TIPOS_MODIFICACION.map((t) => (
                  <SelectItem key={t} value={t}>{TIPOS_CONFIG[t].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={estadoFilter} onValueChange={onEstadoFilterChange}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los estados</SelectItem>
                {ESTADOS_MODIFICACION.map((e) => (
                  <SelectItem key={e} value={e}>{ESTADOS_CONFIG[e].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { onTipoFilterChange('__all__'); onEstadoFilterChange('__all__'); }}
                className="h-9 text-xs text-red-600"
              >
                <X className="w-3 h-3 mr-1" />
                Limpiar
              </Button>
            )}
            {exportFilters && (
              <ExportButton
                endpoint="/reportes/modificaciones"
                filters={exportFilters}
                filename="modificaciones"
              />
            )}
          </div>
        </div>

        {total > 0 && (
          <p className="text-xs text-gray-500">
            Mostrando {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} de {total} modificaciones
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-gray-50/50">
              <TableHead className="font-semibold cursor-pointer select-none" onClick={() => onSort('numero_resolucion')}>
                <div className="flex items-center gap-1.5">Resolución <SortIcon col="numero_resolucion" /></div>
              </TableHead>
              <TableHead className="font-semibold">Entidad</TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold cursor-pointer select-none" onClick={() => onSort('fecha_aprobacion')}>
                <div className="flex items-center gap-1.5">Fecha <SortIcon col="fecha_aprobacion" /></div>
              </TableHead>
              <TableHead className="font-semibold cursor-pointer select-none text-right" onClick={() => onSort('monto_total')}>
                <div className="flex items-center justify-end gap-1.5">Monto <SortIcon col="monto_total" /></div>
              </TableHead>
              <TableHead className="font-semibold cursor-pointer select-none" onClick={() => onSort('estado')}>
                <div className="flex items-center gap-1.5">Estado <SortIcon col="estado" /></div>
              </TableHead>
              <TableHead className="font-semibold">Descripción</TableHead>
              {(canEdit || canDelete) && <TableHead className="w-12 text-right font-semibold">Acciones</TableHead>}
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
                    icon={RefreshCw}
                    title="No hay modificaciones registradas"
                    description={search || hasFilters ? 'No se encontraron resultados' : 'Comienza registrando la primera modificación'}
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map((m) => {
                const tipoCfg = TIPOS_CONFIG[m.tipo_modificacion];
                const estadoCfg = ESTADOS_CONFIG[m.estado];
                const TipoIcon = tipoCfg?.icon || RefreshCw;

                return (
                  <TableRow key={m.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        {m.numero_resolucion}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900 truncate max-w-50">
                      {m.entidad_nombre || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${tipoCfg?.bg || 'bg-gray-50'} ${tipoCfg?.color || 'text-gray-700'} font-medium`}>
                        <TipoIcon className="w-3 h-3 mr-1" />
                        {tipoCfg?.label || m.tipo_modificacion}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {format(new Date(m.fecha_aprobacion), "d 'de' MMM, yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900 tabular-nums">
                      {formatCurrency(m.monto_total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={estadoCfg?.color}>
                        {estadoCfg?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 truncate max-w-50">
                      {m.descripcion || <span className="text-gray-400">—</span>}
                    </TableCell>
                    {(canEdit || canDelete) && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(m)} className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" /> Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPdf(m)} className="cursor-pointer">
                              <FileText className="w-4 h-4 mr-2 text-red-600" /> Descargar PDF
                            </DropdownMenuItem>
                            {canEdit && (
                              <DropdownMenuItem onClick={() => onEdit(m)} className="cursor-pointer">
                                <Pencil className="w-4 h-4 mr-2" /> Editar
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => onDelete(m)}
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