import { useState } from 'react';
import { Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvanceForm } from '@/components/avances/AvanceForm';
import { AvanceTable } from '@/components/avances/AvanceTable';
import {
  useAvancesList, useResumenAnual, useCreateAvance, useUpdateAvance, useDeleteAvance,
} from '@/hooks/useAvances';
import { useEntidades } from '@/hooks/useEntidades';
import { useAuth } from '@/hooks/useAuth';
import type { AvanceEntity, AvanceFormValues } from '@/types/avance';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const currentYear = new Date().getFullYear();

export function AvancesPage() {
  const { canEdit, isAdmin } = useAuth();
  const { data: entidades = [] } = useEntidades();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [anioFilter, setAnioFilter] = useState(String(currentYear));
  const [mesFilter, setMesFilter] = useState('__all__');
  const [chartAnio, setChartAnio] = useState(currentYear);
  const [chartEntidad, setChartEntidad] = useState<string>('__all__');

  const { data, isLoading } = useAvancesList({
    page, limit, search,
    sort_by: 'anio', sort_order: 'desc',
    anio: anioFilter !== '__all__' ? parseInt(anioFilter) : undefined,
    mes: mesFilter !== '__all__' ? parseInt(mesFilter) : undefined,
  });

  const { data: resumen } = useResumenAnual(
    chartEntidad !== '__all__' ? chartEntidad : undefined,
    chartAnio
  );

  const createMut = useCreateAvance();
  const updateMut = useUpdateAvance();
  const deleteMut = useDeleteAvance();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AvanceEntity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AvanceEntity | null>(null);

  const handleSubmit = async (values: AvanceFormValues) => {
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, data: values });
    } else {
      await createMut.mutateAsync(values);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMut.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  // Calcular totales del resumen
  const totalProgramada = resumen?.data.reduce((sum, m) => sum + m.total_programada, 0) || 0;
  const totalEjecutada = resumen?.data.reduce((sum, m) => sum + m.total_ejecutada, 0) || 0;
  const porcentajeGlobal = totalProgramada > 0 ? (totalEjecutada / totalProgramada) * 100 : 0;

  const getBarColor = (pct: number) => {
    if (pct >= 100) return '#10b981'; // emerald
    if (pct >= 75) return '#3b82f6';  // blue
    if (pct >= 50) return '#f59e0b';  // amber
    return '#ef4444';                  // red
  };

  return (
    <div className="p-6 lg:p-8 max-w-400 mx-auto space-y-6">
      <PageHeader
        title="Metas Físicas"
        description="Registro y seguimiento del avance mensual de actividades operativas"
        icon={Activity}
        action={canEdit ? {
          label: 'Registrar Avance',
          onClick: () => { setEditing(null); setFormOpen(true); },
        } : undefined}
      />

      {/* Panel de Resumen con Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* KPIs */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Resumen {chartAnio}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-gray-500">Meta Programada Total</p>
              <p className="text-xl font-bold text-gray-900 tabular-nums">
                {totalProgramada.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Meta Ejecutada Total</p>
              <p className="text-xl font-bold text-emerald-600 tabular-nums">
                {totalEjecutada.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avance Global</p>
              <p className={`text-2xl font-bold tabular-nums ${
                porcentajeGlobal >= 75 ? 'text-emerald-600' :
                porcentajeGlobal >= 50 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {porcentajeGlobal.toFixed(1)}%
              </p>
            </div>

            {/* Filtros del gráfico */}
            <div className="pt-3 border-t space-y-2">
              <Select value={String(chartAnio)} onValueChange={(v) => setChartAnio(parseInt(v))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={chartEntidad} onValueChange={setChartEntidad}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todas las entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas las entidades</SelectItem>
                  {entidades.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avance Mensual {chartAnio}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={resumen?.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes_nombre" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [
                    typeof value === 'number' ? value.toFixed(2) : value ?? '',
                    name,
                  ]}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend />
                <Bar dataKey="total_programada" name="Programada" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_ejecutada" name="Ejecutada" radius={[4, 4, 0, 0]}>
                  {(resumen?.data || []).map((entry, index) => (
                    <Cell key={index} fill={getBarColor(entry.porcentaje)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Avances */}
      <AvanceTable
        data={data?.data || []}
        isLoading={isLoading}
        total={data?.total || 0}
        page={page}
        limit={limit}
        search={search}
        anioFilter={anioFilter}
        mesFilter={mesFilter}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onAnioFilterChange={(v) => { setAnioFilter(v); setPage(1); }}
        onMesFilterChange={(v) => { setMesFilter(v); setPage(1); }}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onEdit={(a) => { setEditing(a); setFormOpen(true); }}
        onDelete={setDeleteTarget}
        canEdit={canEdit}
        isAdmin={isAdmin}
      />

      {/* Dialog Form */}
      <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              {editing ? 'Editar Avance Físico' : 'Registrar Avance Físico'}
            </DialogTitle>
            <DialogDescription>
              {editing ? 'Modifique los datos del avance mensual' : 'Complete el avance físico del período'}
            </DialogDescription>
          </DialogHeader>
          <AvanceForm
            defaultValues={editing || undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setFormOpen(false); setEditing(null); }}
            isLoading={createMut.isPending || updateMut.isPending}
            submitLabel={editing ? 'Actualizar' : 'Registrar'}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Eliminar Avance"
        description={`¿Eliminar el avance de ${deleteTarget?.mes_nombre} ${deleteTarget?.anio}?`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={deleteMut.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}