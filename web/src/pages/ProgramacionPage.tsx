import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { ProgramacionForm } from '@/components/programacion/ProgramacionForm';
import { ProgramacionTable } from '@/components/programacion/ProgramacionTable';
import { ProgramacionDetalleDialog } from '@/components/programacion/ProgramacionDetalleDialog';
import {
  useProgramacionList, useCreateProgramacion, useUpdateProgramacion,
  useAprobarProgramacion, useDeleteProgramacion, useArchivarProgramacion,
  useRestaurarProgramacion,
} from '@/hooks/useProgramacion';
import { useAuth } from '@/hooks/useAuth';
import type { ProgramacionEntity, ProgramacionFormValues } from '@/types/programacion';
import { ProgramacionHistoricoDashboard } from '@/components/programacion/ProgramacionHistoricoDashboard';
import { BarChart3, List } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ProgramacionPage() {
  const { canEdit, isAdmin } = useAuth();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('__all__');
  const [estadoFilter, setEstadoFilter] = useState('__all__');

  const { data, isLoading } = useProgramacionList({
    page, limit, search,
    sort_by: 'creado_en',
    sort_order: 'desc',
    tipo: tipoFilter !== '__all__' ? tipoFilter : undefined,
    estado: estadoFilter !== '__all__' ? estadoFilter : undefined,
  });

  const createMut = useCreateProgramacion();
  const updateMut = useUpdateProgramacion();
  const aprobarMut = useAprobarProgramacion();
  const deleteMut = useDeleteProgramacion();
  const archivarMut = useArchivarProgramacion();
  const restaurarMut = useRestaurarProgramacion();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProgramacionEntity | null>(null);
  const [viewing, setViewing] = useState<ProgramacionEntity | null>(null);
  const [aprobarTarget, setAprobarTarget] = useState<ProgramacionEntity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProgramacionEntity | null>(null);
  const [archivarTarget, setArchivarTarget] = useState<ProgramacionEntity | null>(null);
  const [restaurarTarget, setRestaurarTarget] = useState<ProgramacionEntity | null>(null);

  const handleSubmit = async (values: ProgramacionFormValues) => {
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, data: values });
    } else {
      await createMut.mutateAsync(values);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleAprobar = async () => {
    if (!aprobarTarget) return;
    await aprobarMut.mutateAsync(aprobarTarget.id);
    setAprobarTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMut.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleArchivar = async () => {
    if (!archivarTarget) return;
    await archivarMut.mutateAsync(archivarTarget.id);
    setArchivarTarget(null);
  };
  const handleRestaurar = async () => {
    if (!restaurarTarget) return;
    await restaurarMut.mutateAsync(restaurarTarget.id);
    setRestaurarTarget(null);
  };
  return (
    <div className="p-6 lg:p-8 max-w-400 mx-auto">
      <PageHeader
        title="Programación Multianual"
        description="Planificación y proyección presupuestal a múltiples años fiscales"
        icon={Calendar}
        action={canEdit ? {
          label: 'Nueva Programación',
          onClick: () => { setEditing(null); setFormOpen(true); },
        } : undefined}
      />
      <Tabs defaultValue="listado" className="space-y-6">
        <TabsList className="grid w-full sm:w-100 grid-cols-2 h-12">
          <TabsTrigger value="listado" className="gap-2">
            <List className="w-4 h-4" /> Listado
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-2">
            <BarChart3 className="w-4 h-4" /> Dashboard Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listado">
          <ProgramacionTable
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
            onView={setViewing}
            onEdit={(p) => { setEditing(p); setFormOpen(true); }}
            onAprobar={setAprobarTarget}
            onDelete={setDeleteTarget}
            canEdit={canEdit}
            isAdmin={isAdmin}
            onArchivar={setArchivarTarget}
            onRestaurar={setRestaurarTarget} 
          />
        </TabsContent>

        <TabsContent value="historico">
          <ProgramacionHistoricoDashboard />
        </TabsContent>
      </Tabs>

      {/* Dialog Form */}
      <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              {editing ? 'Editar Programación Multianual' : 'Nueva Programación Multianual'}
            </DialogTitle>
            <DialogDescription>
              {editing ? 'Modifique los datos de la programación' : 'Complete la programación multianual del proyecto'}
            </DialogDescription>
          </DialogHeader>
          <ProgramacionForm
            defaultValues={editing || undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setFormOpen(false); setEditing(null); }}
            isLoading={createMut.isPending || updateMut.isPending}
            submitLabel={editing ? 'Actualizar' : 'Crear'}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Detalle */}
      <ProgramacionDetalleDialog
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        programacion={viewing}
      />

      {/* Dialog Aprobar */}
      <ConfirmDialog
        open={!!aprobarTarget}
        onOpenChange={(o) => !o && setAprobarTarget(null)}
        title="Aprobar Programación"
        description={`¿Está seguro de aprobar la programación "${aprobarTarget?.nombre}"? Una vez aprobada, solo podrá archivarla o modificar observaciones.`}
        confirmLabel="Aprobar"
        variant="default"
        isLoading={aprobarMut.isPending}
        onConfirm={handleAprobar}
      />

      {/* Dialog Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Eliminar Programación"
        description={`¿Eliminar la programación "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={deleteMut.isPending}
        onConfirm={handleDelete}
      />
      
      {/* Dialog Archivar */}
      <ConfirmDialog
        open={!!archivarTarget}
        onOpenChange={(o) => !o && setArchivarTarget(null)}
        title="Archivar Programación"
        description={`¿Está seguro de archivar la programación "${archivarTarget?.nombre}"? Esta acción la moverá al histórico y ya no podrá ser modificada.`}
        confirmLabel="Archivar"
        variant="default"
        isLoading={archivarMut.isPending}
        onConfirm={handleArchivar}
      />
      
      {/* Dialog Restaurar */}
      <ConfirmDialog
        open={!!restaurarTarget}
        onOpenChange={(o) => !o && setRestaurarTarget(null)}
        title="Restaurar Programación"
        description={`¿Está seguro de restaurar la programación "${restaurarTarget?.nombre}"? Volverá a estado Aprobado y podrá ser utilizada nuevamente como referencia presupuestal.`}
        confirmLabel="Restaurar"
        variant="default"
        isLoading={restaurarMut.isPending}
        onConfirm={handleRestaurar}
      />
    </div>
  );
}