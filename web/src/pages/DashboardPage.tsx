import { useState } from 'react';
import { DollarSign, TrendingUp, Wallet, AlertCircle, Target, CheckCircle2 } from 'lucide-react';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { EvolucionMensualChart } from '@/components/dashboard/EvolucionMensualChart';
import { RankingEntidadesTable } from '@/components/dashboard/RankingEntidadesTable';
import { AlertasPanel } from '@/components/dashboard/AlertasPanel';
import {
  useKPIs,
  useEvolucionMensual,
  useRankingEntidades,
  useAlertas,
  useEntidades,
  useClasificadores,
  type DashboardFilters as DashboardFiltersType,
} from '@/hooks/useDashboard';
import { toNumber, formatCurrency, formatPercentage } from '@/lib/numbers';

export function DashboardPage() {
  const currentYear = new Date().getFullYear();

  const [filters, setFilters] = useState<DashboardFiltersType>({
    anio: currentYear,
    entidad_id: 'todas',
    trimestre: 'all',
    mes: 'all',
  });

  const handleFiltersChange = (newFilters: Partial<DashboardFiltersType>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearAll = () => {
    setFilters({
      anio: currentYear,
      entidad_id: 'todas',
      trimestre: 'all',
      mes: 'all',
    });
  };

  // ✅ Extraer los refetch de cada query
  const { data: kpis, isFetching: kpisFetching, refetch: refetchKpis } = useKPIs(filters);
  const { data: evolucion, isFetching: evolucionFetching, refetch: refetchEvolucion } = useEvolucionMensual(filters);
  const { data: ranking, isFetching: rankingFetching, refetch: refetchRanking } = useRankingEntidades(filters);
  const { data: alertas, isFetching: alertasFetching, refetch: refetchAlertas } = useAlertas();
  const { data: entidades = [] } = useEntidades();
  const { data: clasificadores = [] } = useClasificadores();

  // ✅ Usar isFetching en lugar de isLoading
  const isLoadingKpis = kpisFetching;
  const isLoadingEvolucion = evolucionFetching;
  const isLoadingRanking = rankingFetching;
  const isLoadingAlertas = alertasFetching;

  // ✅ Refetch directo a cada query
  const handleRefresh = async () => {
    await Promise.all([
      refetchKpis(),
      refetchEvolucion(),
      refetchRanking(),
      refetchAlertas(),
    ]);
  };

  // El botón se deshabilita mientras CUALQUIER query esté haciendo fetch
  const isRefreshing = kpisFetching || evolucionFetching;

  const pimTotal = toNumber(kpis?.pim_total);
  const saldoDisponible = toNumber(kpis?.saldo_disponible);
  const porcentajeEjecucion = toNumber(kpis?.porcentaje_ejecucion);
  const saldoColor = saldoDisponible > (pimTotal * 0.3) ? 'red' : 'gray';

  return (
    <div className="p-6 lg:p-8 max-w-400 mx-auto">
      <DashboardHero anio={filters.anio} />

      <DashboardFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearAll={handleClearAll}
        entidades={entidades}
        clasificadores={clasificadores}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KpiCard
          title="PIA Total"
          value={formatCurrency(kpis?.pia_total)}
          subtitle="Presupuesto Apertura"
          icon={DollarSign}
          iconColor="blue"
          isLoading={isLoadingKpis}
          variation={toNumber(kpis?.variacion_pia)}
        />
        <KpiCard
          title="PIM Total"
          value={formatCurrency(kpis?.pim_total)}
          subtitle="Presupuesto Modificado"
          icon={TrendingUp}
          iconColor="purple"
          isLoading={isLoadingKpis}
          variation={toNumber(kpis?.variacion_pim)}
        />
        <KpiCard
          title="Certificado"
          value={formatCurrency(kpis?.certificado)}
          subtitle="Monto reservado"
          icon={CheckCircle2}
          iconColor="blue"
          isLoading={isLoadingKpis}
        />
        <KpiCard
          title="Devengado"
          value={formatCurrency(kpis?.devengado)}
          subtitle="Ejecución real"
          icon={Wallet}
          iconColor="green"
          isLoading={isLoadingKpis}
          trend={{
            value: porcentajeEjecucion,
            label: 'ejecución',
          }}
          variation={toNumber(kpis?.variacion_devengado)}
        />
        <KpiCard
          title="% Ejecución"
          value={formatPercentage(kpis?.porcentaje_ejecucion)}
          subtitle="Del PIM"
          icon={Target}
          iconColor="yellow"
          isLoading={isLoadingKpis}
        />
        <KpiCard
          title="Saldo Disponible"
          value={formatCurrency(kpis?.saldo_disponible)}
          subtitle={`${kpis?.total_entidades || 0} entidades`}
          icon={AlertCircle}
          iconColor={saldoColor as 'red' | 'gray'}
          isLoading={isLoadingKpis}
        />
      </div>

      <div className="mb-6">
        <EvolucionMensualChart data={evolucion} isLoading={isLoadingEvolucion} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingEntidadesTable data={ranking} isLoading={isLoadingRanking} />
        <AlertasPanel data={alertas} isLoading={isLoadingAlertas} />
      </div>
    </div>
  );
}