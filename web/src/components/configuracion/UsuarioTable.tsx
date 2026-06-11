import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Pencil, Trash2, Users, Shield, UserCog, Eye } from 'lucide-react';
import type { UsuarioEntity } from '@/types/usuario';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/hooks/useAuth';

interface UsuarioTableProps {
  data: UsuarioEntity[];
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  onCreate: () => void;
  onEdit: (usuario: UsuarioEntity) => void;
  onDelete: (usuario: UsuarioEntity) => void;
}

const ROL_BADGES: Record<string, { icon: typeof Shield; color: string }> = {
  Administrador: { icon: Shield, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  Analista: { icon: UserCog, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  Auditor: { icon: Eye, color: 'bg-green-100 text-green-800 border-green-200' },
};

export function UsuarioTable({
  data, isLoading, search, onSearchChange, onCreate, onEdit, onDelete,
}: UsuarioTableProps) {
  const { user: currentUser } = useAuth();

  const filtered = data.filter((u) => {
    const q = search.toLowerCase();
    return u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por usuario o email..."
            className="pl-9 h-9"
          />
        </div>
        <Button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-gray-50/50">
              <TableHead className="font-semibold">Usuario</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Roles</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="w-24 text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState
                    icon={Users}
                    title="No hay usuarios"
                    description={search ? 'No se encontraron resultados' : 'Comienza creando el primer usuario'}
                    action={!search ? { label: 'Crear usuario', onClick: onCreate } : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((usuario) => {
                const isSelf = currentUser?.id === usuario.id;
                return (
                  <TableRow key={usuario.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {usuario.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{usuario.username}</p>
                          {isSelf && <p className="text-[10px] text-blue-600 font-medium">(Tú)</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">{usuario.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {usuario.roles.map((rol) => {
                          const badge = ROL_BADGES[rol] || { icon: Shield, color: 'bg-gray-100 text-gray-800' };
                          const Icon = badge.icon;
                          return (
                            <Badge key={rol} variant="outline" className={`text-[10px] ${badge.color}`}>
                              <Icon className="w-3 h-3 mr-1" />
                              {rol}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={usuario.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600'}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(usuario)}>
                          <Pencil className="w-4 h-4 text-gray-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-50"
                          onClick={() => onDelete(usuario)}
                          disabled={isSelf}
                          title={isSelf ? 'No puedes eliminar tu propio usuario' : 'Eliminar'}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-gray-500">
        Total: {filtered.length} de {data.length} usuario{data.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}