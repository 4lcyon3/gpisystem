import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import type { EntidadEntity } from '@/types/entidad';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface EntidadTableProps {
  data: EntidadEntity[];
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  onCreate: () => void;
  onEdit: (entidad: EntidadEntity) => void;
  onDelete: (entidad: EntidadEntity) => void;
  canCreate: boolean;
  canDelete: boolean;
}

export function EntidadTable({
  data, isLoading, search, onSearchChange,
  onCreate, onEdit, onDelete, canCreate, canDelete,
}: EntidadTableProps) {
  const filtered = data.filter((e) => {
    const q = search.toLowerCase();
    return e.nombre.toLowerCase().includes(q) || e.ruc.includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o RUC"
            className="pl-9 h-9"
          />
        </div>
        {canCreate && (
          <Button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Entidad
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-gray-50/50">
              <TableHead className="font-semibold">RUC</TableHead>
              <TableHead className="font-semibold">Nombre</TableHead>
              <TableHead className="font-semibold">Sector</TableHead>
              <TableHead className="font-semibold">Nivel</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="w-24 text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={Building2}
                    title="No hay entidades"
                    description={search ? 'No se encontraron resultados' : 'Comienza registrando la primera entidad'}
                    action={canCreate && !search ? { label: 'Crear entidad', onClick: onCreate } : undefined}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entidad) => (
                <TableRow key={entidad.id} className={cn("hover:bg-gray-50/50", !entidad.activo && "opacity-60 bg-gray-50/30")}>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {entidad.ruc}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">{entidad.nombre}</TableCell>
                  <TableCell className="text-gray-600">{entidad.sector || '—'}</TableCell>
                  <TableCell className="text-gray-600">{entidad.nivel_gobierno || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={entidad.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600'}>
                      {entidad.activo ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {canCreate && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entidad)}>
                          <Pencil className="w-4 h-4 text-gray-600" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-50"
                          onClick={() => onDelete(entidad)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-gray-500">
        Total: {filtered.length} de {data.length} entidad{data.length !== 1 ? 'es' : ''}
      </p>
    </div>
  );
}