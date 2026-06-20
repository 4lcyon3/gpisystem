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
  Search, MoreVertical, Eye, Trash2, ChevronLeft, ChevronRight,
  Activity, Filter, X,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import type { EvaluacionEntity } from '@/types/evaluacion';
import { NIVELES_CONFIG, NIVELES_RIESGO, MESES } from '@/types/evaluacion';

interface Props {
  data: EvaluacionEntity[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  search: string;
  nivelFilter: string;
  onSearchChange: (v: string) => void;
  onNivelFilterChange: (v: string) => void;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onView: (e: EvaluacionEntity) => void;
  onDelete: (e: EvaluacionEntity) => void;
  isAdmin: boolean;
}

export function EvaluacionTable({
  data, isLoading, total, page, limit, search, nivelFilter,
  onSearchChange, onNivelFilterChange,
  onPageChange, onLimitChange, onView, onDelete, isAdmin,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasFilters = nivelFilter !== '__all__' || search !== '';

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v || 0);

  const colSpan = isAdmin ? 8 : 7;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar POI, entidad..."
              className="pl-9 h-10"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={nivelFilter} onValueChange={onNivelFilterChange}>
              <SelectTrigger className="w-40 h-10">
                <SelectValue placeholder="Nivel de riesgo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los niveles</SelectItem>
                {NIVELES_RIESGO.map(n => (
                  <SelectItem key={n} value={n}>{NIVELES_CONFIG[n].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { onNivelFilterChange('__all__'); onSearchChange(''); }}
                className="h-10 text-xs text-red-600"
              >
                <X className="w-3 h-3 mr-1" /> Limpiar
              </Button>
            )}
          </div>
        </div>

        {total > 0 && (
          <p className="text-xs text-gray-500">
            Mostrando {Math.min((page - 1) * limit + 1, total)}-{Math.min(page * limit, total)} de {total} evaluaciones
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold">POI</TableHead>
              <TableHead className="font-semibold">Entidad</TableHead>
              <TableHead className="w-25 font-semibold text-center">Período</TableHead>
              <TableHead className="w-25 font-semibold text-center">Eficacia</TableHead>
              <TableHead className="w-25 font-semibold text-center">Eficiencia</TableHead>
              <TableHead className="w-30 font-semibold text-right">Ejecutado</TableHead>
              <TableHead className="w-27.5 font-semibold text-center">Riesgo</TableHead>
              {isAdmin && <TableHead className="w-20" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center py-8 text-gray-500">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="p-0">
                  <EmptyState
                    icon={Activity}
                    title="Sin evaluaciones"
                    description="Calcule la evaluación desde el botón superior"
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map(e => {
                const riesgo = NIVELES_CONFIG[e.nivel_riesgo];
                const mesNombre = MESES.find(m => m.value === e.mes_evaluacion)?.label || '';
                return (
                  <TableRow key={e.id} className="hover:bg-gray-50/50">
                    <TableCell className="max-w-xs">
                      <p className="text-sm font-medium text-gray-900 truncate">{e.poi_nombre}</p>
                      <p className="text-xs text-purple-600 font-mono mt-0.5">{e.poi_codigo}</p>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 truncate max-w-37.5">
                      {e.entidad_nombre || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm font-semibold">{mesNombre}</div>
                      <div className="text-xs text-gray-500">{e.anio_fiscal}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-sm font-bold tabular-nums ${
                        e.indice_eficacia >= 75 ? 'text-emerald-600' :
                        e.indice_eficacia >= 50 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {e.indice_eficacia.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`text-sm font-bold tabular-nums ${
                        e.indice_eficiencia >= 1 ? 'text-emerald-600' :
                        e.indice_eficiencia >= 0.8 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {e.indice_eficiencia.toFixed(2)}x
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900 tabular-nums text-sm">
                      {formatCurrency(e.presupuesto_ejecutado)}
                      <div className="text-xs text-gray-500 font-normal">
                        {e.porcentaje_ejecucion.toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`${riesgo.bgColor} ${riesgo.color} ${riesgo.borderColor} font-semibold`}>
                        {riesgo.label}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(e)} className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" /> Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(e)}
                              className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
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