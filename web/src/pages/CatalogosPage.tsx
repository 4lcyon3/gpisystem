/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type SetStateAction } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BulkUploadDialog } from '@/components/catalogos/BulkUploadDialog';
import { CentroCostoForm } from '@/components/catalogos/CentroCostoForm';
import { MetaPresupuestalForm } from '@/components/catalogos/MetaPresupuestalForm';
import { FuenteFinanciamientoForm } from '@/components/catalogos/FuenteFinanciamientoForm';
import { CatalogSelector, type CatalogType } from '@/components/catalogos/CatalogSelector';
import { SearchableSelect, type SelectOption } from '@/components/ui/searchable-select';
import { Tags } from 'lucide-react'; // Agregar Tags
import { ClasificadorForm } from '@/components/catalogos/ClasificadorForm';
import {
  useCentrosCosto,
  useMetasPresupuestales,
  useFuentesFinanciamiento,
  useCreateCentroCosto,
  useCreateMetaPresupuestal,
  useCreateFuenteFinanciamiento,
  useUpdateCentroCosto,
  useUpdateMetaPresupuestal,
  useUpdateFuenteFinanciamiento,
  useDeleteCentroCosto,
  useDeleteMetaPresupuestal,
  useDeleteFuenteFinanciamiento,
  useBulkDeleteCatalogo,
  useClasificadores,
  useCreateClasificador,
  useUpdateClasificador,
  useDeleteClasificador,
} from '@/hooks/useCatalogos';
import { useEntidades } from '@/hooks/useEntidades';
import { useAuth } from '@/hooks/useAuth';
import {
  Building2, Target, DollarSign, Upload, Plus, Search,
  BookOpen, Pencil, Trash2, MoreVertical,
} from 'lucide-react';

export function CatalogosPage() {
  const { isAdmin, canEdit } = useAuth();
  const { data: entidades = [] } = useEntidades();

  const [activeCatalog, setActiveCatalog] = useState<CatalogType>('centros');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [entidadFilter, setEntidadFilter] = useState<string>('__all__');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Queries
  const { data: centros = [], isLoading: loadCC } = useCentrosCosto(
    entidadFilter !== '__all__' ? entidadFilter : undefined
  );
  const { data: metas = [], isLoading: loadMetas } = useMetasPresupuestales(
    entidadFilter !== '__all__' ? entidadFilter : undefined
  );
  const { data: fuentes = [], isLoading: loadFuentes } = useFuentesFinanciamiento(true);
  const { data: clasificadores = [], isLoading: loadClasificadores } = useClasificadores(true);

  // Mutations individuales
  const createCC = useCreateCentroCosto();
  const createMeta = useCreateMetaPresupuestal();
  const createFuente = useCreateFuenteFinanciamiento();
  const createClasificador = useCreateClasificador();
  const updateCC = useUpdateCentroCosto();
  const updateMeta = useUpdateMetaPresupuestal();
  const updateFuente = useUpdateFuenteFinanciamiento();
  const updateClasificador = useUpdateClasificador();
  const deleteCC = useDeleteCentroCosto();
  const deleteMeta = useDeleteMetaPresupuestal();
  const deleteFuente = useDeleteFuenteFinanciamiento();
  const deleteClasificador = useDeleteClasificador();


  // Mutations masivas
  const bulkDeleteCC = useBulkDeleteCatalogo('centros-costo');
  const bulkDeleteMeta = useBulkDeleteCatalogo('metas-presupuestales');
  const bulkDeleteFuente = useBulkDeleteCatalogo('fuentes-financiamiento');
  const bulkDeleteClasificador = useBulkDeleteCatalogo('clasificadores');

  // Filtros locales
  const filteredCentros = centros.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.codigo.toLowerCase().includes(search.toLowerCase())
  );
  const filteredMetas = metas.filter(m =>
    m.nombre.toLowerCase().includes(search.toLowerCase()) ||
    m.codigo.toLowerCase().includes(search.toLowerCase())
  );
  const filteredFuentes = fuentes.filter(f =>
    f.nombre.toLowerCase().includes(search.toLowerCase()) ||
    f.codigo.toLowerCase().includes(search.toLowerCase())
  );

  const filteredClasificadores = clasificadores.filter(c =>
    c.descripcion.toLowerCase().includes(search.toLowerCase()) ||
    c.codigo.toLowerCase().includes(search.toLowerCase())
  );

  // Datos activos según tab
  const activeData = activeCatalog === 'centros' ? filteredCentros 
    : activeCatalog === 'metas' ? filteredMetas 
    : filteredFuentes;

  // Selección
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(activeData.map(item => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const allSelected = activeData.length > 0 && selectedIds.size === activeData.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < activeData.length;

  // Reset selección al cambiar de catálogo
  const handleCatalogChange = (newCatalog: CatalogType) => {
    setActiveCatalog(newCatalog);
    setSearch('');
    setSelectedIds(new Set());
    if (newCatalog === 'fuentes') setEntidadFilter('__all__');
  };

  // Opciones para filtro de entidad
  const entidadFilterOptions: SelectOption[] = [
    { value: '__all__', label: 'Todas las entidades', badge: '∞' },
    ...entidades.map((e) => ({
      value: e.id,
      label: e.nombre,
      badge: e.ruc,
      keywords: [e.ruc, e.sector].filter(Boolean) as string[],
    })),
  ];

  const openCreate = () => {
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  const handleCreateOrUpdate = async (data: any) => {
    if (activeCatalog === 'centros') {
      if (editingId) await updateCC.mutateAsync({ id: editingId, data });
      else await createCC.mutateAsync(data);
    } else if (activeCatalog === 'metas') {
      if (editingId) await updateMeta.mutateAsync({ id: editingId, data });
      else await createMeta.mutateAsync(data);
    } else if (activeCatalog === 'fuentes') {
      if (editingId) await updateFuente.mutateAsync({ id: editingId, data });
      else await createFuente.mutateAsync(data);
    } else if (activeCatalog === 'clasificadores') {
      if (editingId) await updateClasificador.mutateAsync({ id: editingId, data });
      else await createClasificador.mutateAsync(data);
    }
    setFormOpen(false);
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (activeCatalog === 'centros') await deleteCC.mutateAsync(deleteTarget.id);
    else if (activeCatalog === 'metas') await deleteMeta.mutateAsync(deleteTarget.id);
    else if (activeCatalog === 'fuentes') await deleteFuente.mutateAsync(deleteTarget.id);
    else if (activeCatalog === 'clasificadores') await deleteClasificador.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (activeCatalog === 'centros') await bulkDeleteCC.mutateAsync(ids);
    else if (activeCatalog === 'metas') await bulkDeleteMeta.mutateAsync(ids);
    else if (activeCatalog === 'fuentes') await bulkDeleteFuente.mutateAsync(ids);
    else if (activeCatalog === 'clasificadores') await bulkDeleteClasificador.mutateAsync(ids);
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
  };

  const isFormLoading =
    createCC.isPending || createMeta.isPending || createFuente.isPending || createClasificador.isPending ||
    updateCC.isPending || updateMeta.isPending || updateFuente.isPending || updateClasificador.isPending;

  const isBulkDeleting = bulkDeleteCC.isPending || bulkDeleteMeta.isPending || bulkDeleteFuente.isPending || bulkDeleteClasificador.isPending;

  const editingItem = (() => {
    if (!editingId) return undefined;
    if (activeCatalog === 'centros') return centros.find(c => c.id === editingId);
    if (activeCatalog === 'metas') return metas.find(m => m.id === editingId);
    if (activeCatalog === 'fuentes') return fuentes.find(f => f.id === editingId);
    if (activeCatalog === 'clasificadores') return clasificadores.find(c => c.id === editingId);
  })();

  const catalogTitles: Record<CatalogType, string> = {
    centros: 'Centros de Costo',
    metas: 'Metas Presupuestales',
    fuentes: 'Fuentes de Financiamiento',
    clasificadores: 'Clasificadores de Gasto', // ← NUEVO
  };

  return (
    <div className="p-6 lg:p-8 max-w-400 mx-auto">
      <PageHeader
        title="Gestión de Catálogos Presupuestales"
        description="Administra centros de costo, metas y fuentes de financiamiento."
        icon={BookOpen}
      />

      {/* Selector + Acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <CatalogSelector value={activeCatalog} onChange={handleCatalogChange} />

        <div className="flex gap-2 flex-wrap">
          {/* Botón de eliminación masiva (solo Admin) */}
          {isAdmin && selectedIds.size > 0 && (
            <Button
              variant="destructive"
              onClick={() => setBulkDeleteOpen(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar ({selectedIds.size})
            </Button>
          )}

          <Button variant="outline" onClick={() => setUploadOpen(true)} className="gap-2">
            <Upload className="w-4 h-4" /> Carga Masiva
          </Button>
          {canEdit && (
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-4 h-4" /> Nuevo Registro
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-5 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e: { target: { value: SetStateAction<string>; }; }) => setSearch(e.target.value)}
            className="pl-9 h-12"
          />
        </div>

        {activeCatalog !== 'fuentes' && (
          <div className="w-full sm:w-[320px]">
            <SearchableSelect
              options={entidadFilterOptions}
              value={entidadFilter}
              onChange={setEntidadFilter}
              placeholder="Filtrar por entidad"
              searchPlaceholder="Buscar entidad..."
              icon={<Building2 className="w-4 h-4" />}
              clearable={false}
              showCount
            />
          </div>
        )}
      </div>

      {/* TABLA: CENTROS DE COSTO */}
      {activeCatalog === 'centros' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                {isAdmin && (
                  <TableHead className="w-12.5">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Seleccionar todos"
                      className={someSelected && !allSelected ? 'data-[state=checked]:bg-gray-400' : ''}
                    />
                  </TableHead>
                )}
                <TableHead className="w-30 font-semibold">Código</TableHead>
                <TableHead className="font-semibold">Nombre del Centro</TableHead>
                <TableHead className="font-semibold">Entidad</TableHead>
                <TableHead className="w-25 font-semibold text-center">Estado</TableHead>
                {canEdit && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadCC ? (
                <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-gray-500">Cargando...</TableCell></TableRow>
              ) : filteredCentros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="p-0">
                    <EmptyState icon={Building2} title="Sin centros de costo" description="Crea uno manualmente o usa Carga Masiva." />
                  </TableCell>
                </TableRow>
              ) : (
                filteredCentros.map(c => (
                  <TableRow key={c.id} className={`hover:bg-gray-50/50 ${selectedIds.has(c.id) ? 'bg-blue-50/50' : ''}`}>
                    {isAdmin && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(c.id)}
                          onCheckedChange={(checked: boolean) => handleSelectOne(c.id, checked as boolean)}
                          aria-label={`Seleccionar ${c.nombre}`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">{c.codigo}</span>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{c.nombre}</TableCell>
                    <TableCell className="text-sm text-gray-700">{c.entidad_nombre || '—'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={c.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600'}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(c.id)} className="cursor-pointer">
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget({ id: c.id, nombre: c.nombre })}
                              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TABLA: METAS PRESUPUESTALES */}
      {activeCatalog === 'metas' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                {isAdmin && (
                  <TableHead className="w-12.5">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Seleccionar todos"
                      className={someSelected && !allSelected ? 'data-[state=checked]:bg-gray-400' : ''}
                    />
                  </TableHead>
                )}
                <TableHead className="w-30 font-semibold">Código</TableHead>
                <TableHead className="font-semibold">Nombre de la Meta</TableHead>
                <TableHead className="w-25 font-semibold text-center">Año</TableHead>
                <TableHead className="font-semibold">Entidad</TableHead>
                {canEdit && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadMetas ? (
                <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-gray-500">Cargando...</TableCell></TableRow>
              ) : filteredMetas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="p-0">
                    <EmptyState icon={Target} title="Sin metas presupuestales" description="Importa tu cadena presupuestal." />
                  </TableCell>
                </TableRow>
              ) : (
                filteredMetas.map(m => (
                  <TableRow key={m.id} className={`hover:bg-gray-50/50 ${selectedIds.has(m.id) ? 'bg-blue-50/50' : ''}`}>
                    {isAdmin && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(m.id)}
                          onCheckedChange={(checked: boolean) => handleSelectOne(m.id, checked as boolean)}
                          aria-label={`Seleccionar ${m.nombre}`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded">{m.codigo}</span>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{m.nombre}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-bold">{m.anio_fiscal}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{m.entidad_nombre || '—'}</TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(m.id)} className="cursor-pointer">
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget({ id: m.id, nombre: m.nombre })}
                              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TABLA: FUENTES DE FINANCIAMIENTO */}
      {activeCatalog === 'fuentes' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                {isAdmin && (
                  <TableHead className="w-12.5">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Seleccionar todos"
                      className={someSelected && !allSelected ? 'data-[state=checked]:bg-gray-400' : ''}
                    />
                  </TableHead>
                )}
                <TableHead className="w-30 font-semibold">Código</TableHead>
                <TableHead className="font-semibold">Nombre de la Fuente</TableHead>
                <TableHead className="w-50 font-semibold">Tipo de Rubro</TableHead>
                <TableHead className="w-25 font-semibold text-center">Estado</TableHead>
                {canEdit && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadFuentes ? (
                <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-gray-500">Cargando...</TableCell></TableRow>
              ) : filteredFuentes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="p-0">
                    <EmptyState icon={DollarSign} title="Sin fuentes" description="Registra las fuentes institucionales." />
                  </TableCell>
                </TableRow>
              ) : (
                filteredFuentes.map(f => (
                  <TableRow key={f.id} className={`hover:bg-gray-50/50 ${selectedIds.has(f.id) ? 'bg-blue-50/50' : ''}`}>
                    {isAdmin && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(f.id)}
                          onCheckedChange={(checked: boolean) => handleSelectOne(f.id, checked as boolean)}
                          aria-label={`Seleccionar ${f.nombre}`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">{f.codigo}</span>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{f.nombre}</TableCell>
                    <TableCell className="text-sm text-gray-600">{f.tipo_rubro || '—'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={f.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600'}>
                        {f.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(f.id)} className="cursor-pointer">
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget({ id: f.id, nombre: f.nombre })}
                              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
            {/* TABLA: CLASIFICADORES DE GASTO */}
      {activeCatalog === 'clasificadores' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                {isAdmin && (
                  <TableHead className="w-12.5">
                    <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} aria-label="Seleccionar todos" className={someSelected && !allSelected ? 'data-[state=checked]:bg-gray-400' : ''} />
                  </TableHead>
                )}
                <TableHead className="w-37.5 font-semibold">Código</TableHead>
                <TableHead className="font-semibold">Descripción</TableHead>
                <TableHead className="font-semibold">Genérica</TableHead>
                <TableHead className="w-25 font-semibold text-center">Estado</TableHead>
                {canEdit && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadClasificadores ? (
                <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-gray-500">Cargando...</TableCell></TableRow>
              ) : filteredClasificadores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="p-0">
                    <EmptyState icon={Tags} title="Sin clasificadores" description="Importa tu catálogo de clasificadores mediante CSV." />
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasificadores.map(c => (
                  <TableRow key={c.id} className={`hover:bg-gray-50/50 ${selectedIds.has(c.id) ? 'bg-blue-50/50' : ''}`}>
                    {isAdmin && (
                      <TableCell>
                        <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={(checked) => handleSelectOne(c.id, checked as boolean)} />
                      </TableCell>
                    )}
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded">{c.codigo}</span>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 max-w-xs truncate">{c.descripcion}</TableCell>
                    <TableCell className="text-sm text-gray-600">{c.generica || '—'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={c.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600'}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(c.id)} className="cursor-pointer">
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTarget({ id: c.id, nombre: c.descripcion })} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* DIALOG: Carga Masiva */}
      <BulkUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        tipo={activeCatalog === 'centros' ? 'centros-costo' : activeCatalog === 'metas' ? 'metas-presupuestales' : 'fuentes-financiamiento'}
        titulo={`Importar ${catalogTitles[activeCatalog]}`}
        descripcion="Descarga la plantilla, llena los datos y sube el archivo CSV."
      />

      {/* DIALOG: Formulario */}
      {activeCatalog === 'centros' && (
        <CentroCostoForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={handleCreateOrUpdate} 
        isLoading={isFormLoading} 
        defaultValues={editingItem as any} />
      )}
      {activeCatalog === 'metas' && (
        <MetaPresupuestalForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={handleCreateOrUpdate} 
        isLoading={isFormLoading} 
        defaultValues={editingItem as any} />
      )}
      {activeCatalog === 'fuentes' && (
        <FuenteFinanciamientoForm 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        onSubmit={handleCreateOrUpdate} 
        isLoading={isFormLoading} 
        defaultValues={editingItem as any} />
      )}
       {activeCatalog === 'clasificadores' && (
        <ClasificadorForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleCreateOrUpdate}
          isLoading={isFormLoading}
          defaultValues={editingItem as any}
        />
      )}

      {/* DIALOG: Confirmar Eliminación Individual */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Eliminar ${activeCatalog === 'centros' ? 'Centro de Costo' : activeCatalog === 'metas' ? 'Meta' : 'Fuente'}`}
        description={`¿Está seguro de eliminar "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={deleteCC.isPending || deleteMeta.isPending || deleteFuente.isPending}
        onConfirm={handleDelete}
      />

      {/* DIALOG: Confirmar Eliminación Masiva */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Eliminar ${selectedIds.size} ${catalogTitles[activeCatalog]}`}
        description={`¿Está seguro de eliminar ${selectedIds.size} registro(s) seleccionado(s)? Esta acción no se puede deshacer y solo puede ser realizada por administradores.`}
        confirmLabel={`Eliminar ${selectedIds.size} registros`}
        variant="destructive"
        isLoading={isBulkDeleting}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}