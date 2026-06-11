/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DisponibilidadTable } from '@/components/disponibilidad/DisponibilidadTable';
import { DisponibilidadForm } from '@/components/disponibilidad/DisponibilidadForm';
import { AprobarDialog } from '@/components/disponibilidad/AprobarDialog';
import { RechazarDialog } from '@/components/disponibilidad/RechazarDialog';
import {
  useDisponibilidadList, useCreateDisponibilidad, useUpdateDisponibilidad,
  useAprobarDisponibilidad, useRechazarDisponibilidad, useDeleteDisponibilidad,
} from '@/hooks/useDisponibilidad';
import { useAuth } from '@/hooks/useAuth';
import type { DisponibilidadEntity, DisponibilidadFormValues } from '@/types/disponibilidad';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function DisponibilidadPage() {
  const { canEdit, isAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('__all__');
  const [anioFilter, setAnioFilter] = useState('__all__');

  const { data, isLoading } = useDisponibilidadList({
    page, limit, search,
    estado: estadoFilter !== '__all__' ? estadoFilter : undefined,
    anio_fiscal: anioFilter !== '__all__' ? parseInt(anioFilter) : undefined,
  });

  const createMut = useCreateDisponibilidad();
  const updateMut = useUpdateDisponibilidad();
  const aprobarMut = useAprobarDisponibilidad();
  const rechazarMut = useRechazarDisponibilidad();
  const deleteMut = useDeleteDisponibilidad();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DisponibilidadEntity | null>(null);
  const [, setViewing] = useState<DisponibilidadEntity | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DisponibilidadEntity | null>(null);
  const [aprobarTarget, setAprobarTarget] = useState<DisponibilidadEntity | null>(null);
  const [rechazarTarget, setRechazarTarget] = useState<DisponibilidadEntity | null>(null);

  const handleSubmit = async (values: DisponibilidadFormValues) => {
    try {
      const cleaned = { ...values };
      if (!cleaned.descripcion) delete (cleaned as any).descripcion;
      if (!cleaned.meta_id) delete (cleaned as any).meta_id;

      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, data: cleaned });
      } else {
        await createMut.mutateAsync(cleaned);
      }
      setDialogOpen(false);
      setEditing(null);
    } catch {
        console.error('Error al guardar la solicitud');
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-400 mx-auto">
      <PageHeader
        title="Disponibilidad Presupuestal"
        description="Solicitudes de saldo y requerimientos institucionales"
        icon={FileText}
        action={canEdit ? { label: 'Nueva Solicitud', onClick: () => { setEditing(null); setDialogOpen(true); } } : undefined}
      />

      <DisponibilidadTable
        data={data?.data || []} isLoading={isLoading} total={data?.total || 0}
        page={page} limit={limit} search={search} estadoFilter={estadoFilter} anioFilter={anioFilter}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onEstadoFilterChange={(v) => { setEstadoFilter(v); setPage(1); }}
        onAnioFilterChange={(v) => { setAnioFilter(v); setPage(1); }}
        onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onView={setViewing} onEdit={(d) => { setEditing(d); setDialogOpen(true); }}
        onDelete={setDeleteConfirm} onAprobar={setAprobarTarget} onRechazar={setRechazarTarget}
        canEdit={canEdit} isAdmin={isAdmin}
      />

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Solicitud' : 'Nueva Solicitud de Disponibilidad'}</DialogTitle>
            <DialogDescription>Complete la cadena presupuestal y el monto requerido</DialogDescription>
          </DialogHeader>
          <DisponibilidadForm defaultValues={editing || undefined} onSubmit={handleSubmit} onCancel={() => setDialogOpen(false)} isLoading={createMut.isPending || updateMut.isPending} />
        </DialogContent>
      </Dialog>

      {/* Aprobar Dialog */}
      <AprobarDialog open={!!aprobarTarget} onOpenChange={(o) => !o && setAprobarTarget(null)} disponibilidad={aprobarTarget} isLoading={aprobarMut.isPending}
        onConfirm={async (vals) => { if (aprobarTarget) { await aprobarMut.mutateAsync({ id: aprobarTarget.id, ...vals }); setAprobarTarget(null); } }} />

      {/* Rechazar Dialog */}
      <RechazarDialog open={!!rechazarTarget} onOpenChange={(o) => !o && setRechazarTarget(null)} disponibilidad={rechazarTarget} isLoading={rechazarMut.isPending}
        onConfirm={async (vals) => { if (rechazarTarget) { await rechazarMut.mutateAsync({ id: rechazarTarget.id, ...vals }); setRechazarTarget(null); } }} />

      {/* Delete Confirm */}
      <ConfirmDialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)} title="Eliminar Solicitud"
        description={`¿Eliminar la solicitud ${deleteConfirm?.numero_solicitud}?`} variant="destructive" isLoading={deleteMut.isPending}
        onConfirm={async () => { if (deleteConfirm) { await deleteMut.mutateAsync(deleteConfirm.id); setDeleteConfirm(null); } }} />
    </div>
  );
}