/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Activity, Calculator } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { EvaluacionDashboard } from '@/components/evaluacion/EvaluacionDashboard';
import { EvaluacionTable } from '@/components/evaluacion/EvaluacionTable';
import { EvaluacionDetalleDialog } from '@/components/evaluacion/EvaluacionDetalleDialog';
import {
  useEvaluacionList, useResumenEvaluacion, useCalcularEvaluacion, useDeleteEvaluacion,
} from '@/hooks/useEvaluacion';
import { useEntidades } from '@/hooks/useEntidades';
import { useAuth } from '@/hooks/useAuth';
import { MESES } from '@/types/evaluacion';
import type { EvaluacionEntity } from '@/types/evaluacion';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export function EvaluacionPage() {
  const { isAdmin } = useAuth();
  const { data: entidades = [] } = useEntidades();

  // Filtros globales (aplican tanto al dashboard como a la tabla)
  const [entidadFilter, setEntidadFilter] = useState<string>('__all__');
  const [anioFilter, setAnioFilter] = useState<number>(currentYear);
  const [mesFilter, setMesFilter] = useState<number>(currentMonth);

  // Filtros específicos de la tabla
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [nivelFilter, setNivelFilter] = useState('__all__');

  const { data, isLoading } = useEvaluacionList({
    page,
    limit,
    entidad_id: entidadFilter !== '__all__' ? entidadFilter : undefined,
    anio_fiscal: anioFilter,
    mes_evaluacion: mesFilter,
    nivel_riesgo: nivelFilter !== '__all__' ? nivelFilter as any : undefined,
  });

  const { data: resumen, isLoading: resumenLoading } = useResumenEvaluacion(
    entidadFilter !== '__all__' ? entidadFilter : undefined,
    anioFilter,
    mesFilter
  );

  const calcularMut = useCalcularEvaluacion();
  const deleteMut = useDeleteEvaluacion();

  const [viewing, setViewing] = useState<EvaluacionEntity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EvaluacionEntity | null>(null);
  const [calcularOpen, setCalcularOpen] = useState(false);

  const handleCalcular = async () => {
    await calcularMut.mutateAsync({
      anioFiscal: anioFilter,
      mes: mesFilter,
      entidadId: entidadFilter !== '__all__' ? entidadFilter : undefined,
    });
    setCalcularOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMut.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const mesNombre = MESES.find(m => m.value === mesFilter)?.label || '';

  return (
    <div className="p-6 lg:p-8 max-w-400 mx-auto space-y-6">
      <PageHeader
        title="Evaluación Institucional"
        description="Análisis de eficiencia y eficacia del gasto público"
        icon={Activity}
      />

      {/* Panel de Control Global */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Entidad */}
              <div className="flex-1 min-w-50">
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Entidad</label>
                <Select value={entidadFilter} onValueChange={(v) => { setEntidadFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas las entidades</SelectItem>
                    {entidades.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Año */}
              <div className="w-full sm:w-30">
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Año Fiscal</label>
                <Select value={String(anioFilter)} onValueChange={(v) => { setAnioFilter(parseInt(v)); setPage(1); }}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mes */}
              <div className="w-full sm:w-37.5">
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Mes de Evaluación</label>
                <Select value={String(mesFilter)} onValueChange={(v) => { setMesFilter(parseInt(v)); setPage(1); }}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map(m => (
                      <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botón Calcular */}
            {isAdmin && (
              <Button
                onClick={() => setCalcularOpen(true)}
                disabled={calcularMut.isPending}
                className="bg-blue-600 hover:bg-blue-700 h-10 gap-2 w-full lg:w-auto"
              >
                <Calculator className="w-4 h-4" />
                {calcularMut.isPending ? 'Calculando...' : 'Calcular Evaluación'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Ejecutivo */}
      <EvaluacionDashboard
        resumen={resumen}
        isLoading={resumenLoading}
        anioFiscal={anioFilter}
        mes={mesFilter}
      />

      {/* Tabla Detallada */}
      <EvaluacionTable
        data={data?.data || []}
        isLoading={isLoading}
        total={data?.total || 0}
        page={page}
        limit={limit}
        search={search}
        nivelFilter={nivelFilter}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onNivelFilterChange={(v) => { setNivelFilter(v); setPage(1); }}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onView={setViewing}
        onDelete={setDeleteTarget}
        isAdmin={isAdmin}
      />

      {/* Dialog Detalle */}
      <EvaluacionDetalleDialog
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        evaluacion={viewing}
      />

      {/* Dialog Calcular */}
      <ConfirmDialog
        open={calcularOpen}
        onOpenChange={setCalcularOpen}
        title="Calcular Evaluación Institucional"
        description={`Se cruzarán los Avances Físicos (Módulo 10) con los Gastos (Módulo 9) para ${mesNombre} ${anioFilter}. ¿Desea continuar?`}
        confirmLabel="Calcular"
        variant="default"
        isLoading={calcularMut.isPending}
        onConfirm={handleCalcular}
      />

      {/* Dialog Eliminar */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Eliminar Evaluación"
        description={`¿Eliminar la evaluación del POI "${deleteTarget?.poi_nombre}"?`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={deleteMut.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}