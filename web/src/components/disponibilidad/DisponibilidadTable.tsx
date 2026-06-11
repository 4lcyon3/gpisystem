import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, MoreVertical, Eye, Pencil, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight, FileText, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DisponibilidadEntity } from '@/types/disponibilidad';
import { ESTADOS_DISPONIBILIDAD } from '@/types/disponibilidad';
import { EmptyState } from '@/components/ui/empty-state';

interface Props {
  data: DisponibilidadEntity[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  search: string;
  estadoFilter: string;
  anioFilter: string;
  onSearchChange: (v: string) => void;
  onEstadoFilterChange: (v: string) => void;
  onAnioFilterChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onView: (d: DisponibilidadEntity) => void;
  onEdit: (d: DisponibilidadEntity) => void;
  onDelete: (d: DisponibilidadEntity) => void;
  onAprobar: (d: DisponibilidadEntity) => void;
  onRechazar: (d: DisponibilidadEntity) => void;
  canEdit: boolean;
  isAdmin: boolean;
}

const ESTADOS_CONFIG: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  aprobado: { label: 'Aprobado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rechazado: { label: 'Rechazado', color: 'bg-red-50 text-red-700 border-red-200' },
};

export function DisponibilidadTable(props: Props) {
  const { data, isLoading, total, page, limit, search, estadoFilter, anioFilter,
    onSearchChange, onEstadoFilterChange, onAnioFilterChange, onPageChange, onLimitChange,
    onView, onEdit, onDelete, onAprobar, onRechazar, canEdit, isAdmin } = props;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilters = estadoFilter !== '__all__' || anioFilter !== '__all__';
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const formatCurrency = (v: number) => v ? new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v) : 'S/ 0.00';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Buscar N° solicitud, descripción..." className="pl-9 h-9" />
          </div>
          <div className="flex gap-2 items-center">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={anioFilter} onValueChange={onAnioFilterChange}>
              <SelectTrigger className="w-30 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los años</SelectItem>
                {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={estadoFilter} onValueChange={onEstadoFilterChange}>
              <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los estados</SelectItem>
                {ESTADOS_DISPONIBILIDAD.map(e => <SelectItem key={e} value={e}>{ESTADOS_CONFIG[e].label}</SelectItem>)}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={() => { onEstadoFilterChange('__all__'); onAnioFilterChange('__all__'); }} className="h-9 text-xs text-red-600">
                <X className="w-3 h-3 mr-1" /> Limpiar
              </Button>
            )}
          </div>
        </div>
        {total > 0 && <p className="text-xs text-gray-500">Mostrando {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} de {total} solicitudes</p>}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold">N° Solicitud</TableHead>
              <TableHead className="font-semibold">Entidad / CC</TableHead>
              <TableHead className="font-semibold">Clasificador / Fuente</TableHead>
              <TableHead className="font-semibold text-right">Monto Sol.</TableHead>
              <TableHead className="font-semibold text-right">Monto Aprob.</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold">Fecha</TableHead>
              <TableHead className="w-12 text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>)}</TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="p-0"><EmptyState icon={FileText} title="No hay solicitudes" description={search || hasFilters ? 'No se encontraron resultados' : 'Comience creando una nueva solicitud'} /></TableCell></TableRow>
            ) : (
              data.map((d) => {
                const est = ESTADOS_CONFIG[d.estado];
                const isPendiente = d.estado === 'pendiente';
                return (
                  <TableRow key={d.id} className="hover:bg-gray-50/50">
                    <TableCell><span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">{d.numero_solicitud}</span></TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-37.5">{d.entidad_nombre}</p>
                      <p className="text-xs text-gray-500">{d.centro_costo_nombre}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-mono text-purple-700">{d.clasificador_codigo}</p>
                      <p className="text-xs text-gray-500 truncate max-w-37.5">{d.fuente_nombre}</p>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(d.monto_solicitado)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-700 tabular-nums">{d.monto_aprobado > 0 ? formatCurrency(d.monto_aprobado) : '—'}</TableCell>
                    <TableCell><Badge variant="outline" className={est.color}>{est.label}</Badge></TableCell>
                    <TableCell className="text-xs text-gray-600">{format(new Date(d.fecha_solicitud), 'd MMM yyyy', { locale: es })}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(d)} className="cursor-pointer"><Eye className="w-4 h-4 mr-2" /> Ver detalles</DropdownMenuItem>
                          {isPendiente && canEdit && <DropdownMenuItem onClick={() => onEdit(d)} className="cursor-pointer"><Pencil className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>}
                          {isPendiente && isAdmin && (
                            <>
                              <DropdownMenuItem onClick={() => onAprobar(d)} className="cursor-pointer text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50"><CheckCircle className="w-4 h-4 mr-2" /> Aprobar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onRechazar(d)} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"><XCircle className="w-4 h-4 mr-2" /> Rechazar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDelete(d)} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"><Trash2 className="w-4 h-4 mr-2" /> Eliminar</DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <Select value={limit.toString()} onValueChange={(v) => onLimitChange(parseInt(v))}>
            <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>{[10, 25, 50].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(page - 1)} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm font-medium">{page} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}