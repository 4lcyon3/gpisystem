import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Activity, Target, DollarSign, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { EvaluacionEntity } from '@/types/evaluacion';
import { NIVELES_CONFIG, MESES } from '@/types/evaluacion';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluacion: EvaluacionEntity | null;
}

export function EvaluacionDetalleDialog({ open, onOpenChange, evaluacion }: Props) {
  if (!evaluacion) return null;

  const riesgo = NIVELES_CONFIG[evaluacion.nivel_riesgo];
  const mesNombre = MESES.find(m => m.value === evaluacion.mes_evaluacion)?.label || '';

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v || 0);

  const chartData = [
    { 
      name: 'Meta Física',
      Programada: evaluacion.meta_fisica_programada,
      Ejecutada: evaluacion.meta_fisica_ejecutada,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Detalle de Evaluación Institucional
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Encabezado */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase">Actividad Operativa (POI)</p>
              <p className="text-lg font-bold text-gray-900 truncate">{evaluacion.poi_nombre}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-purple-600">{evaluacion.poi_codigo}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-600">{evaluacion.entidad_nombre}</span>
              </div>
            </div>
            <Badge variant="outline" className={`${riesgo.bgColor} ${riesgo.color} ${riesgo.borderColor} px-3 py-1 text-sm font-bold`}>
              {riesgo.label}
            </Badge>
          </div>

          {/* Período */}
          <div className="text-sm text-gray-600">
            Período evaluado: <span className="font-semibold">{mesNombre} {evaluacion.anio_fiscal}</span>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-semibold text-emerald-700">Eficacia</p>
              </div>
              <p className="text-xl font-bold text-emerald-900 tabular-nums">
                {evaluacion.indice_eficacia.toFixed(1)}%
              </p>
            </div>

            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <p className="text-xs font-semibold text-purple-700">Eficiencia</p>
              </div>
              <p className="text-xl font-bold text-purple-900 tabular-nums">
                {evaluacion.indice_eficiencia.toFixed(2)}x
              </p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 col-span-2">
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-semibold text-blue-700">Ejecución Presupuestal</p>
              </div>
              <p className="text-xl font-bold text-blue-900 tabular-nums">
                {evaluacion.porcentaje_ejecucion.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Gráfico Comparativo */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-700">Comparativo de Meta Física</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Programada" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Ejecutada" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla de Montos */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-700">Detalle Financiero</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Concepto</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-700">Programado</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-700">Ejecutado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-4 py-2 font-medium">Meta Física</td>
                    <td className="px-4 py-2 text-right tabular-nums">{evaluacion.meta_fisica_programada.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-bold tabular-nums">{evaluacion.meta_fisica_ejecutada.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 font-medium">Presupuesto</td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatCurrency(evaluacion.presupuesto_programado)}</td>
                    <td className="px-4 py-2 text-right font-bold tabular-nums">{formatCurrency(evaluacion.presupuesto_ejecutado)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Explicación del Riesgo */}
          <div className={`p-4 rounded-lg border-2 ${riesgo.bgColor} ${riesgo.borderColor}`}>
            <p className={`text-sm font-bold ${riesgo.color} mb-1`}>
              Clasificación de Riesgo: {riesgo.label}
            </p>
            <p className="text-xs text-gray-700">
              {evaluacion.nivel_riesgo === 'critico' && 
                '⚠️ Este POI presenta alto gasto (>80%) con bajo avance físico (<40%). Requiere intervención inmediata.'}
              {evaluacion.nivel_riesgo === 'alerta' && 
                '⚠️ Este POI presenta gasto moderado (>60%) con avance físico bajo (<50%). Monitorear de cerca.'}
              {evaluacion.nivel_riesgo === 'normal' && 
                '✅ Este POI presenta un balance adecuado entre avance físico y ejecución presupuestal.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}