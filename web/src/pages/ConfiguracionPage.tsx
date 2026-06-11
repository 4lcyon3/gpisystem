import { useState } from 'react';
import { Settings, Building2, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EntidadForm } from '@/components/configuracion/EntidadForm';
import { EntidadTable } from '@/components/configuracion/EntidadTable';
import { UsuarioForm } from '@/components/configuracion/UsuarioForm';
import { UsuarioTable } from '@/components/configuracion/UsuarioTable';
import {
  useEntidades,
  useCreateEntidad,
  useUpdateEntidad,
  useDeleteEntidad,
} from '@/hooks/useEntidades';
import {
  useUsuarios,
  useCreateUsuario,
  useUpdateUsuario,
  useDeleteUsuario,
} from '@/hooks/useUsuarios';
import { useAuth } from '@/hooks/useAuth';
import type { EntidadEntity, EntidadFormValues } from '@/types/entidad';
import type { UsuarioEntity, UsuarioCreateValues, UsuarioUpdateValues } from '@/types/usuario';

export function ConfiguracionPage() {
  const { isAdmin, canEdit } = useAuth();

  // Entidades
  const { data: entidades = [], isLoading: loadingEntidades } = useEntidades({ 
    includeInactive: true 
  });
  const createEntidad = useCreateEntidad();
  const updateEntidad = useUpdateEntidad();
  const deleteEntidad = useDeleteEntidad();

  // Usuarios
  const { data: usuarios = [], isLoading: loadingUsuarios } = useUsuarios({ 
    includeInactive: true 
  });
  const createUsuario = useCreateUsuario();
  const updateUsuario = useUpdateUsuario();
  const deleteUsuario = useDeleteUsuario();

  // Estados UI
  const [searchEntidad, setSearchEntidad] = useState('');
  const [searchUsuario, setSearchUsuario] = useState('');

  const [entidadDialog, setEntidadDialog] = useState<{ open: boolean; editing: EntidadEntity | null }>({
    open: false,
    editing: null,
  });
  const [usuarioDialog, setUsuarioDialog] = useState<{ open: boolean; editing: UsuarioEntity | null }>({
    open: false,
    editing: null,
  });
  const [deleteEntidadConfirm, setDeleteEntidadConfirm] = useState<EntidadEntity | null>(null);
  const [deleteUsuarioConfirm, setDeleteUsuarioConfirm] = useState<UsuarioEntity | null>(null);

  // Handlers Entidades
  const handleSubmitEntidad = async (values: EntidadFormValues) => {
    try {
      if (entidadDialog.editing) {
        await updateEntidad.mutateAsync({ id: entidadDialog.editing.id, data: values });
      } else {
        await createEntidad.mutateAsync(values);
      }
      setEntidadDialog({ open: false, editing: null });
    } catch {
      // errores manejados en hooks
    }
  };

  const handleDeleteEntidad = async () => {
    if (!deleteEntidadConfirm) return;
    try {
      await deleteEntidad.mutateAsync(deleteEntidadConfirm.id);
      setDeleteEntidadConfirm(null);
    } catch {
      // errores manejados en hooks
    }
  };

  // Handlers Usuarios
  const handleSubmitUsuario = async (values: UsuarioCreateValues | UsuarioUpdateValues) => {
    try {
      if (usuarioDialog.editing) {
        await updateUsuario.mutateAsync({ id: usuarioDialog.editing.id, data: values as UsuarioUpdateValues });
      } else {
        await createUsuario.mutateAsync(values as UsuarioCreateValues);
      }
      setUsuarioDialog({ open: false, editing: null });
    } catch {
      // errores manejados en hooks
    }
  };

  const handleDeleteUsuario = async () => {
    if (!deleteUsuarioConfirm) return;
    try {
      await deleteUsuario.mutateAsync(deleteUsuarioConfirm.id);
      setDeleteUsuarioConfirm(null);
    } catch {
      // errores manejados en hooks
      console.error('Error al eliminar usuario');
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-400 mx-auto">
      <PageHeader
        title="Configuración del Sistema"
        description="Gestiona entidades públicas y usuarios del sistema"
        icon={Settings}
      />

      <Tabs defaultValue="entidades" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="entidades" className="gap-2">
            <Building2 className="w-4 h-4" />
            Entidades ({entidades.length})
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="w-4 h-4" />
            Usuarios ({usuarios.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab Entidades */}
        <TabsContent value="entidades">
          <EntidadTable
            data={entidades}
            isLoading={loadingEntidades}
            search={searchEntidad}
            onSearchChange={setSearchEntidad}
            onCreate={() => setEntidadDialog({ open: true, editing: null })}
            onEdit={(e) => setEntidadDialog({ open: true, editing: e })}
            onDelete={setDeleteEntidadConfirm}
            canCreate={canEdit}
            canDelete={isAdmin}
          />
        </TabsContent>

        {/* Tab Usuarios */}
        <TabsContent value="usuarios">
          {isAdmin ? (
            <UsuarioTable
              data={usuarios}
              isLoading={loadingUsuarios}
              search={searchUsuario}
              onSearchChange={setSearchUsuario}
              onCreate={() => setUsuarioDialog({ open: true, editing: null })}
              onEdit={(u) => setUsuarioDialog({ open: true, editing: u })}
              onDelete={setDeleteUsuarioConfirm}
            />
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
              <p className="text-amber-900 font-medium">
                Solo los administradores pueden gestionar usuarios
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog Entidad */}
      <Dialog
        open={entidadDialog.open}
        onOpenChange={(open) => !open && setEntidadDialog({ open: false, editing: null })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              {entidadDialog.editing ? 'Editar Entidad' : 'Nueva Entidad'}
            </DialogTitle>
            <DialogDescription>
              {entidadDialog.editing
                ? 'Modifique los datos de la entidad'
                : 'Registre una nueva entidad pública en el sistema'}
            </DialogDescription>
          </DialogHeader>
          <EntidadForm
            defaultValues={
              entidadDialog.editing
                ? {
                    ...entidadDialog.editing,
                    nivel_gobierno: entidadDialog.editing.nivel_gobierno as
                      | ""
                      | "Nacional"
                      | "Regional"
                      | "Local"
                      | undefined,
                  }
                : undefined
            }
            onSubmit={handleSubmitEntidad}
            onCancel={() => setEntidadDialog({ open: false, editing: null })}
            isLoading={createEntidad.isPending || updateEntidad.isPending}
            submitLabel={entidadDialog.editing ? 'Actualizar' : 'Crear'}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Usuario */}
      <Dialog
        open={usuarioDialog.open}
        onOpenChange={(open) => !open && setUsuarioDialog({ open: false, editing: null })}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {usuarioDialog.editing ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              {usuarioDialog.editing
                ? 'Modifique los datos del usuario y sus roles'
                : 'Cree un nuevo usuario y asígnele los roles correspondientes'}
            </DialogDescription>
          </DialogHeader>
          <UsuarioForm
            mode={usuarioDialog.editing ? 'edit' : 'create'}
            defaultValues={usuarioDialog.editing || undefined}
            onSubmit={handleSubmitUsuario}
            onCancel={() => setUsuarioDialog({ open: false, editing: null })}
            isLoading={createUsuario.isPending || updateUsuario.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Confirmación eliminar Entidad */}
      <ConfirmDialog
        open={!!deleteEntidadConfirm}
        onOpenChange={(open) => !open && setDeleteEntidadConfirm(null)}
        title="Eliminar Entidad"
        description={`¿Está seguro de eliminar la entidad "${deleteEntidadConfirm?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={deleteEntidad.isPending}
        onConfirm={handleDeleteEntidad}
      />

      {/* Confirmación eliminar Usuario */}
      <ConfirmDialog
        open={!!deleteUsuarioConfirm}
        onOpenChange={(open) => !open && setDeleteUsuarioConfirm(null)}
        title="Eliminar Usuario"
        description={`¿Está seguro de eliminar al usuario "${deleteUsuarioConfirm?.username}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={deleteUsuario.isPending}
        onConfirm={handleDeleteUsuario}
      />
    </div>
  );
}