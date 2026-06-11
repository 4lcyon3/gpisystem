import { useState } from 'react';
import { ListTodo, Target } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PoiTable } from '@/components/poi/PoiTable';
import { PoiForm } from '@/components/poi/PoiForm';
import { usePoiList, useCreatePoi, useUpdatePoi, useDeletePoi } from '@/hooks/usePoi';
import { useEntidades } from '@/hooks/useEntidades';
import { useAuth } from '@/hooks/useAuth';
import type { PoiEntity, PoiFormValues } from '@/types/poi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const estadoConfig: Record<string, { label: string; color: string }> = {
  programada: { label: 'Programada', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  en_ejecucion: { label: 'En Ejecución', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  completada: { label: 'Completada', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600 border-gray-300' },
};

export function PoiPage() {
  const { canEdit } = useAuth();
  const { data: entidades = [] } = useEntidades();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [entidadFilter, setEntidadFilter] = useState('__all__');
  const [sortBy, setSortBy] = useState('creado_en');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading } = usePoiList({
    page, limit, search,
    sort_by: sortBy,
    sort_order: sortOrder,
    entidad_id: entidadFilter !== '__all__' ? entidadFilter : undefined,
  });

  const createMutation = useCreatePoi();
  const updateMutation = useUpdatePoi();
  const deleteMutation = useDeletePoi();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPoi, setEditingPoi] = useState<PoiEntity | null>(null);
  const [viewingPoi, setViewingPoi] = useState<PoiEntity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PoiEntity | null>(null);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleSubmit = async (values: PoiFormValues & { entidad_id: string }) => {
    try {
      const cleaned = { ...values };
      const optionalFields = ['area_responsable', 'responsable_directo', 'unidad_medida', 'fuente_financiamiento_preliminar'] as const;
      optionalFields.forEach((field) => {
        if (cleaned[field] === '') delete cleaned[field];
      });
      if (cleaned.meta_fisica_anual === undefined || Number.isNaN(cleaned.meta_fisica_anual)) delete cleaned.meta_fisica_anual;
      if (cleaned.presupuesto_estimado === undefined || Number.isNaN(cleaned.presupuesto_estimado)) delete cleaned.presupuesto_estimado;

      if (editingPoi) {
        await updateMutation.mutateAsync({ id: editingPoi.id, data: cleaned });
      } else {
        await createMutation.mutateAsync(cleaned);
      }
      setDialogOpen(false);
      setEditingPoi(null);
    } catch {
      console.error('Error al guardar la actividad operativa');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch {
      console.error('Error al eliminar la actividad operativa');
    }
  };

  const formatCurrency = (v: number | undefined) => {
    if (!v) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);
  };

  return (
    <div className="p-6 lg:p-8 max-w-400 mx-auto">
      <PageHeader
        title="Plan Operativo Institucional (POI)"
        description="Gestión de actividades operativas vinculadas a objetivos estratégicos"
        icon={ListTodo}
        action={canEdit ? {
          label: 'Nueva Actividad',
          onClick: () => { setEditingPoi(null); setDialogOpen(true); },
        } : undefined}
      />

      <PoiTable
        data={data?.data || []}
        isLoading={isLoading}
        total={data?.total || 0}
        page={page}
        limit={limit}
        search={search}
        entidadFilter={entidadFilter}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onEntidadFilterChange={(v) => { setEntidadFilter(v); setPage(1); }}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onView={setViewingPoi}
        onEdit={(poi) => { setEditingPoi(poi); setDialogOpen(true); }}
        onDelete={setDeleteConfirm}
        canEdit={canEdit}
        entidadOptions={entidades}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingPoi(null); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-blue-600" />
              {editingPoi ? 'Editar Actividad Operativa' : 'Nueva Actividad Operativa'}
            </DialogTitle>
            <DialogDescription>
              {editingPoi ? 'Modifique los datos de la actividad' : 'Complete la información para crear una nueva actividad'}
            </DialogDescription>
          </DialogHeader>
          <PoiForm
            defaultValues={editingPoi ? { ...editingPoi, entidad_id: editingPoi.entidad_id } : undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setDialogOpen(false); setEditingPoi(null); }}
            isLoading={createMutation.isPending || updateMutation.isPending}
            submitLabel={editingPoi ? 'Actualizar' : 'Crear'}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingPoi} onOpenChange={(open) => !open && setViewingPoi(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-blue-600" />
              Detalle de Actividad Operativa
            </DialogTitle>
          </DialogHeader>
          {viewingPoi && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Código</p>
                  <p className="text-sm font-mono font-semibold text-purple-700 mt-1">{viewingPoi.codigo_actividad}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Estado</p>
                  <Badge variant="outline" className={`mt-1 ${estadoConfig[viewingPoi.estado].color}`}>
                    {estadoConfig[viewingPoi.estado].label}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Nombre</p>
                <p className="text-sm text-gray-900 mt-1 font-medium">{viewingPoi.nombre}</p>
              </div>
              {viewingPoi.pei_codigo && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 uppercase mb-1">Vinculada al Objetivo Estratégico</p>
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-mono font-semibold text-blue-900">{viewingPoi.pei_codigo}</p>
                      <p className="text-sm text-blue-800">{viewingPoi.pei_descripcion}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-medium text-gray-500 uppercase">Área Responsable</p><p className="text-sm text-gray-900 mt-1">{viewingPoi.area_responsable || '—'}</p></div>
                <div><p className="text-xs font-medium text-gray-500 uppercase">Responsable Directo</p><p className="text-sm text-gray-900 mt-1">{viewingPoi.responsable_directo || '—'}</p></div>
                <div><p className="text-xs font-medium text-gray-500 uppercase">Unidad de Medida</p><p className="text-sm text-gray-900 mt-1">{viewingPoi.unidad_medida || '—'}</p></div>
                <div><p className="text-xs font-medium text-gray-500 uppercase">Meta Física Anual</p><p className="text-sm text-gray-900 mt-1 font-semibold">{viewingPoi.meta_fisica_anual ?? '—'}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Presupuesto Estimado</p>
                  <p className="text-lg font-bold text-gray-900 mt-1 tabular-nums">{formatCurrency(viewingPoi.presupuesto_estimado)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Fuente de Financiamiento</p>
                  <p className="text-sm text-gray-900 mt-1">{viewingPoi.fuente_financiamiento_preliminar || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Fecha de Inicio</p>
                  <p className="text-sm text-gray-900 mt-1">{format(new Date(viewingPoi.fecha_inicio), "d 'de' MMMM, yyyy", { locale: es })}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Fecha de Fin</p>
                  <p className="text-sm text-gray-900 mt-1">{format(new Date(viewingPoi.fecha_fin), "d 'de' MMMM, yyyy", { locale: es })}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Eliminar Actividad Operativa"
        description={`¿Está seguro de eliminar la actividad "${deleteConfirm?.codigo_actividad}"?`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}