import { useState } from 'react';
import { Target } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PeiTable } from '@/components/pei/PeiTable';
import { PeiForm } from '@/components/pei/PeiForm';
import { usePeiList, useCreatePei, useUpdatePei, useDeletePei } from '@/hooks/usePei';
import { useEntidades } from '@/hooks/useEntidades';
import { useAuth } from '@/hooks/useAuth';
import type { PeiEntity, PeiFormValues } from '@/types/pei';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const estadoConfig: Record<string, { label: string; color: string }> = {
  vigente: { label: 'Vigente', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  modificado: { label: 'Modificado', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  archivado: { label: 'Archivado', color: 'bg-gray-100 text-gray-600 border-gray-300' },
};

export function PeiPage() {
  const { canEdit } = useAuth();
  const { data: entidades = [] } = useEntidades();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [entidadFilter, setEntidadFilter] = useState('__all__');
  const [sortBy, setSortBy] = useState('creado_en');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading } = usePeiList({
    page, limit, search,
    sort_by: sortBy,
    sort_order: sortOrder,
    entidad_id: entidadFilter !== '__all__' ? entidadFilter : undefined,
  });

  const createMutation = useCreatePei();
  const updateMutation = useUpdatePei();
  const deleteMutation = useDeletePei();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPei, setEditingPei] = useState<PeiEntity | null>(null);
  const [viewingPei, setViewingPei] = useState<PeiEntity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<PeiEntity | null>(null);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleSubmit = async (values: PeiFormValues) => {
    try {
      if (editingPei) {
        await updateMutation.mutateAsync({ id: editingPei.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setDialogOpen(false);
      setEditingPei(null);
    } catch {
      console.error('Error al guardar el objetivo estratégico');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch {
      console.error('Error al eliminar el objetivo estratégico');
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-400 mx-auto">
      <PageHeader
        title="Plan Estratégico Institucional (PEI)"
        description="Gestión de objetivos estratégicos institucionales"
        icon={Target}
        action={canEdit ? {
          label: 'Nuevo Objetivo',
          onClick: () => { setEditingPei(null); setDialogOpen(true); },
        } : undefined}
      />

      <PeiTable
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
        onView={setViewingPei}
        onEdit={(pei) => { setEditingPei(pei); setDialogOpen(true); }}
        onDelete={setDeleteConfirm}
        canEdit={canEdit}
        entidadOptions={entidades}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingPei(null); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              {editingPei ? 'Editar Objetivo Estratégico' : 'Nuevo Objetivo Estratégico'}
            </DialogTitle>
            <DialogDescription>
              {editingPei ? 'Modifique los datos del objetivo estratégico' : 'Complete la información para crear un nuevo objetivo'}
            </DialogDescription>
          </DialogHeader>
          <PeiForm
            defaultValues={editingPei || undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setDialogOpen(false); setEditingPei(null); }}
            isLoading={createMutation.isPending || updateMutation.isPending}
            submitLabel={editingPei ? 'Actualizar' : 'Crear'}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingPei} onOpenChange={(open) => !open && setViewingPei(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Detalle del Objetivo Estratégico
            </DialogTitle>
          </DialogHeader>
          {viewingPei && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Código</p>
                  <p className="text-sm font-mono font-semibold text-blue-700 mt-1">{viewingPei.codigo_objetivo}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Estado</p>
                  <Badge variant="outline" className={`mt-1 ${estadoConfig[viewingPei.estado].color}`}>
                    {estadoConfig[viewingPei.estado].label}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Descripción</p>
                <p className="text-sm text-gray-900 mt-1">{viewingPei.descripcion}</p>
              </div>
              {viewingPei.accion_estrategica && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Acción Estratégica</p>
                  <p className="text-sm text-gray-900 mt-1">{viewingPei.accion_estrategica}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-medium text-gray-500 uppercase">Indicador</p><p className="text-sm text-gray-900 mt-1">{viewingPei.indicador || '—'}</p></div>
                <div><p className="text-xs font-medium text-gray-500 uppercase">Unidad de Medida</p><p className="text-sm text-gray-900 mt-1">{viewingPei.unidad_medida || '—'}</p></div>
                <div><p className="text-xs font-medium text-gray-500 uppercase">Línea Base</p><p className="text-sm text-gray-900 mt-1">{viewingPei.linea_base || '—'}</p></div>
                <div><p className="text-xs font-medium text-gray-500 uppercase">Meta Anual</p><p className="text-sm text-gray-900 mt-1">{viewingPei.meta_anual || '—'}</p></div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Área Responsable</p>
                <p className="text-sm text-gray-900 mt-1">{viewingPei.area_responsable || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Fecha de Inicio</p>
                  <p className="text-sm text-gray-900 mt-1">{format(new Date(viewingPei.vigencia_inicio), "d 'de' MMMM, yyyy", { locale: es })}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Fecha de Fin</p>
                  <p className="text-sm text-gray-900 mt-1">{format(new Date(viewingPei.vigencia_fin), "d 'de' MMMM, yyyy", { locale: es })}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Eliminar Objetivo Estratégico"
        description={`¿Está seguro de eliminar el objetivo "${deleteConfirm?.codigo_objetivo}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}