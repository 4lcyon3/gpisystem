import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Eye,
  AlertTriangle,
  FileSpreadsheet,
  History,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Carga } from '@/hooks/useCargas';
import { cn } from '@/lib/utils';

interface HistorialCargasTableProps {
  cargas: Carga[] | undefined;
  isLoading: boolean;
  onViewProgress: (cargaId: string) => void;
  onViewErrors: (cargaId: string) => void;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const estadoConfig = {
  pendiente: {
    label: 'Pendiente',
    icon: Clock,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    iconColor: 'text-gray-500',
  },
  procesando: {
    label: 'Procesando',
    icon: Loader2,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    iconColor: 'text-blue-600',
  },
  procesado: {
    label: 'Completado',
    icon: CheckCircle2,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    iconColor: 'text-emerald-600',
  },
  error: {
    label: 'Con Errores',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    iconColor: 'text-red-600',
  },
};

export function HistorialCargasTable({
  cargas,
  isLoading,
  onViewProgress,
  onViewErrors,
}: HistorialCargasTableProps) {
  if (isLoading) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const data = cargas || [];

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-4 h-4 text-blue-600" />
          Historial de Importaciones
        </CardTitle>
        <CardDescription>
          {data.length} carga{data.length !== 1 ? 's' : ''} registrada
          {data.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Sin importaciones todavía
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Sube tu primer archivo Excel o CSV para comenzar a analizar los
              datos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Archivo</TableHead>
                  <TableHead className="font-semibold">Tamaño</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold text-center">
                    Filas OK
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Errores
                  </TableHead>
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold text-right">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((carga) => {
                  const config = estadoConfig[carga.estado];
                  const Icon = config.icon;
                  const hasErrors = carga.filas_error > 0;

                  return (
                    <TableRow key={carga.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-50">
                              {carga.nombre_archivo.replace(/^.*[\\/]/, '')}
                            </p>
                            <p className="text-xs text-gray-500 uppercase">
                              {carga.tipo_archivo}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 tabular-nums">
                        {formatBytes(carga.tamanio_bytes)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'gap-1 font-medium',
                            config.color
                          )}
                        >
                          <Icon
                            className={cn(
                              'w-3 h-3',
                              config.iconColor,
                              carga.estado === 'procesando' && 'animate-spin'
                            )}
                          />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-semibold text-emerald-700 tabular-nums">
                          {carga.filas_ok.toLocaleString('es-PE')}
                        </span>
                        {carga.filas_total > 0 && (
                          <span className="text-xs text-gray-400 ml-1">
                            / {carga.filas_total.toLocaleString('es-PE')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {hasErrors ? (
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-700">
                            <AlertTriangle className="w-3 h-3" />
                            {carga.filas_error.toLocaleString('es-PE')}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(carga.creado_en), "d 'de' MMM, HH:mm", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(carga.estado === 'procesando' ||
                            carga.estado === 'pendiente') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewProgress(carga.id)}
                              className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Ver progreso
                            </Button>
                          )}
                          {carga.estado === 'procesado' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewProgress(carga.id)}
                              className="h-8 text-xs text-gray-600 hover:text-gray-900"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              Detalles
                            </Button>
                          )}
                          {hasErrors && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewErrors(carga.id)}
                              className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                              Ver errores
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}