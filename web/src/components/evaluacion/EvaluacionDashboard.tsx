import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity, AlertTriangle, CheckCircle2, TrendingUp, DollarSign, Target,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  RadialBarChart, RadialBar,
} from 'recharts';
import type { ResumenEvaluacion } from '@/types/evaluacion';

interface Props {
  resumen: ResumenEvaluacion | undefined;
  isLoading: boolean;
  anioFiscal: number;
  mes: number;
}

export function EvaluacionDashboard({ resumen, isLoading, anioFiscal, mes }: Props) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-PE', { 
      style: 'currency', 
      currency: 'PEN', 
      maximumFractionDigits: 0 
    }).format(v || 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!resumen || resumen.total_pois === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold text-amber-900">Sin datos de evaluación</p>
            <p className="text-sm text-amber-700">
              Haga clic en "Calcular Evaluación" para generar los indicadores cruzando Avances Físicos y Gastos.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { name: 'Normal', value: resumen.pois_normales, color: '#10b981' },
    { name: 'Alerta', value: resumen.pois_alerta, color: '#f59e0b' },
    { name: 'Crítico', value: resumen.pois_criticos, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const porcentajeEjecucion = resumen.presupuesto_total > 0
    ? (resumen.gasto_total / resumen.presupuesto_total) * 100
    : 0;

  const radialData = [{ name: 'Ejecución', value: porcentajeEjecucion, fill: '#3b82f6' }];

  return (
    <div className="space-y-4">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total POIs */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Total POIs Evaluados</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{resumen.total_pois}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eficacia Promedio */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Eficacia Promedio</p>
                <p className={`text-2xl font-bold mt-1 tabular-nums ${
                  resumen.eficacia_promedio >= 75 ? 'text-emerald-600' :
                  resumen.eficacia_promedio >= 50 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {resumen.eficacia_promedio.toFixed(1)}%
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eficiencia Promedio */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Eficiencia Promedio</p>
                <p className={`text-2xl font-bold mt-1 tabular-nums ${
                  resumen.eficiencia_promedio >= 1 ? 'text-emerald-600' :
                  resumen.eficiencia_promedio >= 0.8 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {resumen.eficiencia_promedio.toFixed(2)}x
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Físico/Financiero</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ejecución Presupuestal */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Ejecución Global</p>
                <p className="text-2xl font-bold text-blue-600 mt-1 tabular-nums">
                  {porcentajeEjecucion.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatCurrency(resumen.gasto_total)} de {formatCurrency(resumen.presupuesto_total)}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Semáforo de Riesgo + Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Semáforo */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Distribución por Nivel de Riesgo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-900">Normal</span>
              </div>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                {resumen.pois_normales}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-semibold text-amber-900">Alerta</span>
              </div>
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 font-bold">
                {resumen.pois_alerta}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-semibold text-red-900">Crítico</span>
              </div>
              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 font-bold">
                {resumen.pois_criticos}
              </Badge>
            </div>

            <div className="pt-2 text-xs text-gray-500 text-center">
              Período: {mes}/{anioFiscal}
            </div>
          </CardContent>
        </Card>

        {/* PieChart */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Proporción Visual</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={(entry) => `${entry.value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radial Chart de Ejecución */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Ejecución Presupuestal Global</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                data={radialData}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  background={{ fill: '#f3f4f6' }}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-2xl font-bold fill-blue-600"
                >
                  {porcentajeEjecucion.toFixed(0)}%
                </text>
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}