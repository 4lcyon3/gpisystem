/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { DisponibilidadEntity } from '@/types/disponibilidad';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disponibilidad: DisponibilidadEntity | null;
}

const ESTADOS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  aprobado: { label: 'Aprobado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  rechazado: { label: 'Rechazado', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
};

export function DisponibilidadDetalleDialog({ open, onOpenChange, disponibilidad }: Props) {
  if (!disponibilidad) return null;

  const estadoCfg = ESTADOS_CONFIG[disponibilidad.estado] || ESTADOS_CONFIG.pendiente;
  const EstadoIcon = estadoCfg.icon;

  const formatCurrency = (v: number) => 
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Detalle de Solicitud de Disponibilidad
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Encabezado con Estado y N° Solicitud */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">N° de Solicitud</p>
              <p className="text-lg font-mono font-bold text-gray-900">{disponibilidad.numero_solicitud}</p>
            </div>
            <Badge variant="outline" className={`${estadoCfg.color} px-3 py-1 text-sm font-semibold flex items-center gap-1.5`}>
              <EstadoIcon className="w-4 h-4" />
              {estadoCfg.label}
            </Badge>
          </div>

          {/* Identificación */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-700 border-b pb-1">1. Identificación</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Entidad</p>
                <p className="font-medium text-gray-900">{disponibilidad.entidad_nombre || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Centro de Costo</p>
                <p className="font-medium text-gray-900">{disponibilidad.centro_costo_nombre || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Fecha de Solicitud</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(disponibilidad.fecha_solicitud), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Año Fiscal</p>
                <p className="font-medium text-gray-900">{disponibilidad.anio_fiscal}</p>
              </div>
            </div>
          </div>

          {/* Vinculación Presupuestal */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-700 border-b pb-1">2. Vinculación Presupuestal</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Actividad Operativa (POI)</p>
                <p className="font-medium text-gray-900">{disponibilidad.poi_nombre || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Meta Presupuestal</p>
                <p className="font-medium text-gray-900">{(disponibilidad as any).meta_nombre || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Clasificador de Gasto</p>
                <p className="font-medium text-gray-900">
                  <span className="font-mono text-orange-600">{disponibilidad.clasificador_codigo}</span> - {disponibilidad.clasificador_descripcion}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Fuente de Financiamiento</p>
                <p className="font-medium text-gray-900">{disponibilidad.fuente_nombre || '—'}</p>
              </div>
            </div>
          </div>

          {/* Montos */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-700 border-b pb-1">3. Impacto Económico</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 font-medium uppercase">Monto Solicitado</p>
                <p className="text-xl font-bold text-blue-900 tabular-nums mt-1">
                  {formatCurrency(disponibilidad.monto_solicitado)}
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${
                disponibilidad.estado === 'aprobado' ? 'bg-emerald-50 border-emerald-100' : 
                disponibilidad.estado === 'rechazado' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'
              }`}>
                <p className={`text-xs font-medium uppercase ${
                  disponibilidad.estado === 'aprobado' ? 'text-emerald-600' : 
                  disponibilidad.estado === 'rechazado' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  Monto Aprobado
                </p>
                <p className={`text-xl font-bold tabular-nums mt-1 ${
                  disponibilidad.estado === 'aprobado' ? 'text-emerald-900' : 
                  disponibilidad.estado === 'rechazado' ? 'text-red-900' : 'text-gray-700'
                }`}>
                  {formatCurrency(disponibilidad.monto_aprobado)}
                </p>
              </div>
            </div>
          </div>

          {/* Justificación y Observaciones */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-700 border-b pb-1">4. Justificación y Resolución</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-1">Descripción / Justificación</p>
                <p className="text-gray-800 bg-gray-50 p-3 rounded border min-h-10">
                  {disponibilidad.descripcion || <span className="text-gray-400 italic">Sin descripción proporcionada</span>}
                </p>
              </div>
              
              {disponibilidad.observaciones && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">Observaciones de la Resolución</p>
                  <p className={`p-3 rounded border min-h-10 ${
                    disponibilidad.estado === 'rechazado' 
                      ? 'bg-red-50 text-red-800 border-red-200' 
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {disponibilidad.observaciones}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}