import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import type { ProgramacionEntity } from '@/types/programacion';


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programacion: ProgramacionEntity | null;
}

const ESTADOS_CONFIG: Record<string, { label: string; color: string }> = {
  borrador: { label: 'Borrador', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  aprobado: { label: 'Aprobado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  archivado: { label: 'Archivado', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const TIPOS_LABELS: Record<string, string> = {
  proyecto: 'Proyecto de Inversión',
  actividad: 'Actividad Operativa',
  inversion: 'Inversión',
  servicio: 'Servicio',
};

export function ProgramacionDetalleDialog({ open, onOpenChange, programacion }: Props) {
  if (!programacion) return null;

  const est = ESTADOS_CONFIG[programacion.estado];

  const formatCurrency = (v: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v || 0);
  };

  // Datos para el gráfico
  const chartData = programacion.detalles.map(d => ({
    anio: d.anio_fiscal,
    monto: d.monto_programado,
    meta: d.meta_fisica,
  }));

  const getBarColor = (index: number) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Detalle de Programación Multianual
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Encabezado */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Nombre del Proyecto</p>
              <p className="text-lg font-bold text-gray-900">{programacion.nombre}</p>
              <p className="text-sm text-gray-600 mt-1">{TIPOS_LABELS[programacion.tipo]}</p>
            </div>
            <Badge variant="outline" className={`${est.color} px-3 py-1 text-sm font-semibold flex items-center gap-1.5`}>
              <CheckCircle className="w-4 h-4" />
              {est.label}
            </Badge>
          </div>

          {/* Información General */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-700 border-b pb-1">Información General</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Entidad</p>
                <p className="font-medium text-gray-900">{programacion.entidad_nombre || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Período</p>
                <p className="font-medium text-gray-900">{programacion.anio_inicio} - {programacion.anio_fin}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Fecha de Creación</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(programacion.creado_en), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Cantidad de Años</p>
                <p className="font-medium text-gray-900">{programacion.cantidad_anios} años</p>
              </div>
            </div>
          </div>

          {/* Gráfico de Distribución */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-700 border-b pb-1">Distribución Anual de Montos</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="anio" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => {
                    const num = typeof value === 'number' ? value : Number(value ?? 0);
                    return [formatCurrency(num), 'Monto Programado'];
                  }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend />
                <Bar dataKey="monto" name="Monto Programado" radius={[4, 4, 0, 0]}>
                  {chartData.map((_entry, index) => (
                    <Cell key={index} fill={getBarColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla de Detalles */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-700 border-b pb-1">Detalle por Año Fiscal</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Año</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-700">Monto Programado</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-700">Meta Física</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {programacion.detalles.map((d, idx) => (
                    <tr key={d.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-2 font-semibold text-gray-900">{d.anio_fiscal}</td>
                      <td className="px-4 py-2 text-right font-bold text-gray-900 tabular-nums">
                        {formatCurrency(d.monto_programado)}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-700 tabular-nums">
                        {d.meta_fisica.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-gray-600">{d.unidad_medida || '—'}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 border-t-2 border-blue-200">
                    <td className="px-4 py-2 font-bold text-blue-900">TOTAL</td>
                    <td className="px-4 py-2 text-right font-bold text-blue-900 tabular-nums">
                      {formatCurrency(programacion.monto_total)}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-blue-900 tabular-nums">
                      {programacion.detalles.reduce((sum, d) => sum + d.meta_fisica, 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-blue-700">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Observaciones */}
          {programacion.observaciones && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-700 border-b pb-1">Observaciones</h4>
              <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded border">
                {programacion.observaciones}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}