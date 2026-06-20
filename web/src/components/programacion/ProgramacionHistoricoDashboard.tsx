import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEntidades } from '@/hooks/useEntidades';
import { useAnaliticaHistorico } from '@/hooks/useProgramacion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Archive, FileEdit, TrendingUp, DollarSign, Calendar } from 'lucide-react';

const ESTADO_COLORS: Record<string, string> = {
  borrador: '#9ca3af',
  aprobado: '#10b981',
  archivado: '#f59e0b',
};

const TIPO_COLORS: Record<string, string> = {
  proyecto: '#3b82f6',
  actividad: '#8b5cf6',
  inversion: '#ec4899',
  servicio: '#14b8a6',
};

const TIPOS_LABELS: Record<string, string> = {
  proyecto: 'Proyectos',
  actividad: 'Actividades',
  inversion: 'Inversiones',
  servicio: 'Servicios',
};

const ESTADOS_LABELS: Record<string, string> = {
  borrador: 'Borradores',
  aprobado: 'Aprobados',
  archivado: 'Archivados',
};

export function ProgramacionHistoricoDashboard() {
  const { data: entidades = [] } = useEntidades();
  const [entidadId, setEntidadId] = useState<string>('');
  const { data, isLoading } = useAnaliticaHistorico(entidadId || undefined);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(v || 0);

  const estadoData = data?.por_estado
    ? Object.entries(data.por_estado).map(([estado, cantidad]) => ({
        name: ESTADOS_LABELS[estado] || estado,
        value: cantidad,
        color: ESTADO_COLORS[estado] || '#6b7280',
      }))
    : [];

  const tipoData = data?.por_tipo
    ? Object.entries(data.por_tipo).map(([tipo, cantidad]) => ({
        name: TIPOS_LABELS[tipo] || tipo,
        value: cantidad,
        color: TIPO_COLORS[tipo] || '#6b7280',
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Filtro de entidad */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Filtrar por Entidad</p>
              <p className="text-xs text-gray-500">Vea las estadísticas globales o por entidad específica</p>
            </div>
            <Select value={entidadId} onValueChange={setEntidadId}>
              <SelectTrigger className="w-70">
                <SelectValue placeholder="Todas las entidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las entidades</SelectItem>
                {entidades.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            Cargando analítica histórica...
          </CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            No hay datos disponibles
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <FileEdit className="w-4 h-4" /> Total Programaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{data.total_programaciones}</p>
                <p className="text-xs text-gray-500 mt-1">Borradores + Aprobadas + Archivadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Archive className="w-4 h-4 text-amber-600" /> Archivadas (Histórico)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-600">
                  {data.por_estado.archivado || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Programaciones completadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Total Histórico Programado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                  {formatCurrency(data.total_historico_programado)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Suma de todos los años aprobados/archivados</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribución por estado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Distribución por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={estadoData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {estadoData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribución por tipo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Distribución por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={tipoData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {tipoData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Evolución anual */}
          {data.evolucion_anual.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Evolución Histórica por Año de Inicio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.evolucion_anual}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="anio" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip
                        formatter={(value, name) => {
                          const num = typeof value === 'number' ? value : Number(value ?? 0);
                          if (name === 'Monto Total') {
                            return [formatCurrency(num), name];
                          }
                          return [num, name];
                        }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="cantidad" name="Cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="monto_total" name="Monto Total" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}