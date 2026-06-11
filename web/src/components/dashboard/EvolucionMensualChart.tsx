import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { EvolucionMensual } from '@/hooks/useDashboard';

interface EvolucionMensualChartProps {
  data: EvolucionMensual[] | undefined;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function EvolucionMensualChart({ data, isLoading }: EvolucionMensualChartProps) {
  if (isLoading) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-75 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base">Evolución Mensual</CardTitle>
          <CardDescription>Comparativa PIA vs PIM vs Devengado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-75 text-gray-400 text-sm">
            No hay datos disponibles para el período seleccionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-base">Evolución Mensual</CardTitle>
        <CardDescription>Comparativa PIA vs PIM vs Devengado por mes</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="mes_nombre"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(v) => `S/ ${(v / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value, name) => {
                if (value == null) return ['-', name];
              
                return [
                  formatCurrency(Number(value)),
                  name === 'pim'
                    ? 'PIM'
                    : name === 'devengado'
                    ? 'Devengado'
                    : 'Girado',
                ];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  pim: 'PIM',
                  devengado: 'Devengado',
                  girado: 'Girado',
                };
                return labels[value] || value;
              }}
            />
            <Line
              type="monotone"
              dataKey="pim"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="devengado"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="girado"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}