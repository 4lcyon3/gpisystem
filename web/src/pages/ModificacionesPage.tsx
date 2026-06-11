/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ModificacionTable } from '@/components/modificaciones/ModificacionTable';
import { ModificacionForm } from '@/components/modificaciones/ModificacionForm';
import {
  useModificacionesList,
  useCreateModificacion,
  useUpdateModificacion,
  useDeleteModificacion,
} from '@/hooks/useModificaciones';
import { useAuth } from '@/hooks/useAuth';
import type { ModificacionEntity, ModificacionFormValues } from '@/types/modificacion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const TIPOS_LABELS: Record<string, string> = {
  Habilitacion: 'Habilitación',
  Anulacion: 'Anulación',
  'Credito Suplementario': 'Crédito Suplementario',
  Transferencia: 'Transferencia',
};

const ESTADOS_LABELS: Record<string, string> = {
  aprobada: 'Aprobada',
  pendiente: 'Pendiente',
  anulada: 'Anulada',
};

export function ModificacionesPage() {
  const { canEdit, isAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('__all__');
  const [estadoFilter, setEstadoFilter] = useState('__all__');
  const [sortBy, setSortBy] = useState('fecha_aprobacion');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading } = useModificacionesList({
    page, limit, search,
    sort_by: sortBy, sort_order: sortOrder,
    tipo_modificacion: tipoFilter !== '__all__' ? tipoFilter : undefined,
    estado: estadoFilter !== '__all__' ? estadoFilter : undefined,
  });

  const createMutation = useCreateModificacion();
  const updateMutation = useUpdateModificacion();
  const deleteMutation = useDeleteModificacion();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMod, setEditingMod] = useState<ModificacionEntity | null>(null);
  const [viewingMod, setViewingMod] = useState<ModificacionEntity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ModificacionEntity | null>(null);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleSubmit = async (values: ModificacionFormValues) => {
    try {
      const cleaned = { ...values };
      if (!cleaned.descripcion) delete (cleaned as any).descripcion;

      if (editingMod) {
        await updateMutation.mutateAsync({ id: editingMod.id, data: cleaned });
      } else {
        await createMutation.mutateAsync(cleaned);
      }
      setDialogOpen(false);
      setEditingMod(null);
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
  };

  return (
    <div className="p-6 lg:p-8 max-w-400 mx-auto">
      <PageHeader
        title="Modificaciones Presupuestarias"
        description="Histórico de cambios al PIA que generan el PIM institucional"
        icon={RefreshCw}
        action={canEdit ? {
          label: 'Nueva Modificación',
          onClick: () => { setEditingMod(null); setDialogOpen(true); },
        } : undefined}
      />

      <ModificacionTable
        data={data?.data || []}
        isLoading={isLoading}
        total={data?.total || 0}
        page={page}
        limit={limit}
        search={search}
        tipoFilter={tipoFilter}
        estadoFilter={estadoFilter}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onTipoFilterChange={(v) => { setTipoFilter(v); setPage(1); }}
        onEstadoFilterChange={(v) => { setEstadoFilter(v); setPage(1); }}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onView={setViewingMod}
        onEdit={(m) => { setEditingMod(m); setDialogOpen(true); }}
        onDelete={setDeleteConfirm}
        canEdit={canEdit}
        canDelete={isAdmin}
      />

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingMod(null); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              {editingMod ? 'Editar Modificación' : 'Nueva Modificación Presupuestaria'}
            </DialogTitle>
            <DialogDescription>
              {editingMod
                ? 'Modifique los datos de la modificación presupuestaria'
                : 'Registre una nueva modificación que impactará el PIM institucional'}
            </DialogDescription>
          </DialogHeader>
          <ModificacionForm
            defaultValues={editingMod || undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setDialogOpen(false); setEditingMod(null); }}
            isLoading={createMutation.isPending || updateMutation.isPending}
            submitLabel={editingMod ? 'Actualizar' : 'Registrar'}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Ver Detalles */}
      <Dialog open={!!viewingMod} onOpenChange={(open) => !open && setViewingMod(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              Detalle de la Modificación
            </DialogTitle>
          </DialogHeader>
          {viewingMod && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Resolución</p>
                  <p className="text-sm font-mono font-bold text-blue-700 mt-1">{viewingMod.numero_resolucion}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Estado</p>
                  <Badge variant="outline" className="mt-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                    {ESTADOS_LABELS[viewingMod.estado]}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Entidad</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{viewingMod.entidad_nombre}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Tipo</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {TIPOS_LABELS[viewingMod.tipo_modificacion]}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Fecha de Aprobación</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {format(new Date(viewingMod.fecha_aprobacion), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </div>

              <div className="bg-linear-to-br from-blue-500 to-indigo-600 p-5 rounded-lg">
                <p className="text-xs font-medium text-blue-100 uppercase">Monto Total</p>
                <p className="text-2xl font-bold text-white mt-2 tabular-nums">
                  {formatCurrency(viewingMod.monto_total)}
                </p>
              </div>

              {viewingMod.descripcion && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Descripción</p>
                  <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">
                    {viewingMod.descripcion}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Eliminar Modificación"
        description={`¿Está seguro de eliminar la resolución "${deleteConfirm?.numero_resolucion}"? Esta acción no se puede deshacer y solo puede ser realizada por administradores.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}