/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PresupuestoTable } from '@/components/presupuesto/PresupuestoTable';
import { PresupuestoForm } from '@/components/presupuesto/PresupuestoForm';
import {
  usePresupuestoList,
  useCreatePresupuesto,
  useUpdatePresupuesto,
  useDeletePresupuesto,
} from '@/hooks/usePresupuesto';
import { useAuth } from '@/hooks/useAuth';
import type { PresupuestoEntity, PresupuestoFormValues } from '@/types/presupuesto';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export function PresupuestoPage() {
  const { canEdit } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('creado_en');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading } = usePresupuestoList({
    page, limit, search, sort_by: sortBy, sort_order: sortOrder,
  });
  const createMutation = useCreatePresupuesto();
  const updateMutation = useUpdatePresupuesto();
  const deleteMutation = useDeletePresupuesto();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPresupuesto, setEditingPresupuesto] = useState<PresupuestoEntity | null>(null);
  const [viewingPresupuesto, setViewingPresupuesto] = useState<PresupuestoEntity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PresupuestoEntity | null>(null);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleSubmit = async (values: PresupuestoFormValues) => {
    try {
      // Limpiar valores opcionales vacíos
      const cleaned = { ...values };
      if (cleaned.poi_id === '' || cleaned.poi_id === '__none__') {
        delete (cleaned as any).poi_id;
      }
      if (cleaned.meta_presupuestal === '') {
        delete (cleaned as any).meta_presupuestal;
      }

      if (editingPresupuesto) {
        await updateMutation.mutateAsync({ id: editingPresupuesto.id, data: cleaned });
      } else {
        await createMutation.mutateAsync(cleaned);
      }
      setDialogOpen(false);
      setEditingPresupuesto(null);
    } catch {
      // errores manejados en hooks
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch {
      // errores manejados en hooks
    }
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
  };

  return (
    <div className="p-6 lg:p-8 max-w-400 mx-auto">
      <PageHeader
        title="Formulación Presupuestal (PIA / PIM)"
        description="Gestión del presupuesto institucional de apertura y modificado"
        icon={DollarSign}
        action={canEdit ? {
          label: 'Nuevo Presupuesto',
          onClick: () => { setEditingPresupuesto(null); setDialogOpen(true); },
        } : undefined}
      />

      <PresupuestoTable
        data={data?.data || []}
        isLoading={isLoading}
        total={data?.total || 0}
        page={page}
        limit={limit}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onView={setViewingPresupuesto}
        onEdit={(p) => { setEditingPresupuesto(p); setDialogOpen(true); }}
        onDelete={setDeleteConfirm}
        canEdit={canEdit}
      />

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingPresupuesto(null); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">  {/* ← Cambiar de max-w-3xl a max-w-5xl */}
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              {editingPresupuesto ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
            </DialogTitle>
            <DialogDescription>
              {editingPresupuesto
                ? 'Modifique los datos del presupuesto institucional'
                : 'Complete la información para registrar un nuevo presupuesto'}
            </DialogDescription>
          </DialogHeader>
          <PresupuestoForm
            defaultValues={editingPresupuesto || undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setDialogOpen(false); setEditingPresupuesto(null); }}
            isLoading={createMutation.isPending || updateMutation.isPending}
            submitLabel={editingPresupuesto ? 'Actualizar' : 'Crear'}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Ver Detalles */}
      <Dialog open={!!viewingPresupuesto} onOpenChange={(open) => !open && setViewingPresupuesto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Detalle del Presupuesto
            </DialogTitle>
          </DialogHeader>
          {viewingPresupuesto && (
            <div className="space-y-5">
              {/* Identificación */}
              <div className="space-y-3 pb-4 border-b">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Entidad</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{viewingPresupuesto.entidad_nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Año Fiscal</p>
                    <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200 font-bold">
                      {viewingPresupuesto.anio_fiscal}
                    </Badge>
                  </div>
                </div>
                {viewingPresupuesto.poi_nombre && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Actividad Operativa (POI)</p>
                    <p className="text-sm text-gray-900 mt-1">{viewingPresupuesto.poi_nombre}</p>
                  </div>
                )}
                {viewingPresupuesto.meta_presupuestal && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Meta Presupuestal</p>
                    <p className="text-sm font-mono text-gray-900 mt-1">{viewingPresupuesto.meta_presupuestal}</p>
                  </div>
                )}
              </div>

              {/* Clasificación */}
              <div className="space-y-3 pb-4 border-b">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Centro de Costo</p>
                    <p className="text-sm text-gray-900 mt-1">{viewingPresupuesto.centro_costo_nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Clasificador</p>
                    <p className="text-sm font-mono font-semibold text-purple-700 mt-1">
                      {viewingPresupuesto.clasificador_codigo}
                    </p>
                    <p className="text-xs text-gray-600">{viewingPresupuesto.clasificador_descripcion}</p>
                  </div>
                </div>
              </div>

              {/* Montos */}
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase">PIA</p>
                    <p className="text-xl font-bold text-gray-900 mt-2 tabular-nums">
                      {formatCurrency(viewingPresupuesto.pia)}
                    </p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <p className="text-xs font-medium text-amber-700 uppercase">Modificaciones</p>
                    <p className="text-xl font-bold text-amber-900 mt-2 tabular-nums">
                      {formatCurrency(viewingPresupuesto.modificaciones_acumuladas)}
                    </p>
                  </div>
                  <div className="bg-linear-to-br from-blue-500 to-indigo-600 p-4 rounded-lg">
                    <p className="text-xs font-medium text-blue-100 uppercase">PIM</p>
                    <p className="text-xl font-bold text-white mt-2 tabular-nums">
                      {formatCurrency(viewingPresupuesto.pim)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Eliminar Presupuesto"
        description={`¿Está seguro de eliminar este presupuesto del año ${deleteConfirm?.anio_fiscal}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}