import { useState } from 'react';
import { FileCheck, Building2, Search, MoreVertical, Eye, XCircle, Trash2, Filter, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
 Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SearchableSelect, type SelectOption } from '@/components/ui/searchable-select';
import { EmptyState } from '@/components/ui/empty-state';
import { CertificacionForm } from '@/components/certificaciones/CertificacionForm';
import {
  useCertificacionesList, useCreateCertificacion, useAnularCertificacion, useDeleteCertificacion,
} from '@/hooks/useCertificaciones';
import { useEntidades } from '@/hooks/useEntidades';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CertificacionEntity, CertificacionFormValues } from '@/types/certificacion';
import { ESTADOS_CERTIFICACION } from '@/types/certificacion';
import { ExportButton } from '@/components/ui/export-button';
import { FileText } from 'lucide-react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

const ESTADOS_CONFIG: Record<string, { label: string; color: string }> = {
  vigente: { label: 'Vigente', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  anulada: { label: 'Anulada', color: 'bg-red-50 text-red-700 border-red-200' },
  ejecutada: { label: 'Ejecutada', color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

export function CertificacionesPage() {
  const { isAdmin } = useAuth();
  const { data: entidades = [] } = useEntidades();

  const [page, setPage] = useState(1);
  const [limit, ] = useState(10);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('__all__');
  const [entidadFilter, setEntidadFilter] = useState('__all__');
  const [anioFilter, setAnioFilter] = useState<string>(String(new Date().getFullYear())); 

  const { data, isLoading } = useCertificacionesList({
    page, limit, search,
    estado: estadoFilter !== '__all__' ? estadoFilter : undefined,
    entidad_id: entidadFilter !== '__all__' ? entidadFilter : undefined,
    anio_fiscal: anioFilter !== '__all__' ? parseInt(anioFilter) : undefined,
  });

  const createMut = useCreateCertificacion();
  const anularMut = useAnularCertificacion();
  const deleteMut = useDeleteCertificacion();

  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<CertificacionEntity | null>(null);
  const [anularTarget, setAnularTarget] = useState<CertificacionEntity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CertificacionEntity | null>(null);

  const entidadOptions: SelectOption[] = [
    { value: '__all__', label: 'Todas las entidades', badge: '∞' },
    ...entidades.map((e) => ({
      value: e.id, label: e.nombre, badge: e.ruc,
      keywords: [e.ruc, e.sector].filter(Boolean) as string[],
    })),
  ];

    const handleDownloadPdf = async (cert: CertificacionEntity) => {
    try {
      const response = await api.get(`/reportes/certificaciones/${cert.id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CCP_${cert.numero_certificado}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF del certificado descargado');
    } catch (error) {
      toast.error('Error al generar el PDF: ' + error);
    }
  };

  const handleCreate = async (values: CertificacionFormValues) => {
    await createMut.mutateAsync(values);
    setFormOpen(false);
  };

  const handleAnular = async (observaciones: string) => {
    if (!anularTarget) return;
    await anularMut.mutateAsync({ id: anularTarget.id, observaciones });
    setAnularTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMut.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const formatCurrency = (v?: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v || 0);

  const hasFilters = entidadFilter !== '__all__' || estadoFilter !== '__all__' || anioFilter !== String(new Date().getFullYear());

  return (
    <div className="p-6 lg:p-8 max-w-400 mx-auto">
      <PageHeader
        title="Certificación Presupuestal"
        description="Emisión y gestión de Certificados de Crédito Presupuestario (CCP)"
        icon={FileCheck}
        action={isAdmin ? { label: 'Emitir Certificado', onClick: () => setFormOpen(true) } : undefined}
      />

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-6 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="N° certificado..." className="pl-9 h-12" />
          </div>

          <div className="w-full lg:w-[320px]">
            <SearchableSelect
              options={entidadOptions}
              value={entidadFilter}
              onChange={(v) => { setEntidadFilter(v); setPage(1); }}
              placeholder="Filtrar por entidad"
              searchPlaceholder="Buscar entidad..."
              icon={<Building2 className="w-4 h-4" />}
              clearable={false}
              showCount
            />
          </div>
        </div>


        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={anioFilter} onValueChange={(v) => { setAnioFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los años</SelectItem>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={estadoFilter} onValueChange={(v) => { setEstadoFilter(v); setPage(1); }}>
            <SelectTrigger className="w-45 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los estados</SelectItem>
              {ESTADOS_CERTIFICACION.map(e => <SelectItem key={e} value={e}>{ESTADOS_CONFIG[e].label}</SelectItem>)}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setEntidadFilter('__all__'); setEstadoFilter('__all__'); }} className="h-10 text-xs text-red-600">
              <X className="w-3 h-3 mr-1" /> Limpiar
            </Button>
          )}
            <ExportButton
              endpoint="/reportes/certificaciones"
              filters={{
                entidad_id: entidadFilter !== '__all__' ? entidadFilter : undefined,
                anio_fiscal: anioFilter !== '__all__' ? anioFilter : undefined,
                estado: estadoFilter !== '__all__' ? estadoFilter : undefined,
              }}
              filename="certificaciones"
            />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-37.5 font-semibold">N° Certificado</TableHead>
              <TableHead className="font-semibold">Entidad</TableHead>
              <TableHead className="font-semibold">Disponibilidad</TableHead>
              <TableHead className="font-semibold cursor-pointer select-none text-right">Monto</TableHead>
              <TableHead className="w-32.5 font-semibold">Fecha</TableHead>
              <TableHead className="w-30 font-semibold">Estado</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">Cargando...</TableCell></TableRow>
            ) : (data?.data || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState icon={FileCheck} title="Sin certificaciones" description="Emite el primer Certificado de Crédito Presupuestario" />
                </TableCell>
              </TableRow>
            ) : (
              (data?.data || []).map(cert => {
                const est = ESTADOS_CONFIG[cert.estado];
                const isVigente = cert.estado === 'vigente';
                return (
                  <TableRow key={cert.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                        {cert.numero_certificado}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 truncate max-w-50">{cert.entidad_nombre || '—'}</TableCell>
                    <TableCell className="text-sm text-blue-600 font-mono">{cert.disponibilidad_numero || '—'}</TableCell>
                    <TableCell className="text-right font-bold text-gray-900 tabular-nums">{formatCurrency(cert.monto_certificado)}</TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {format(new Date(cert.fecha_certificacion), 'd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell><Badge variant="outline" className={est.color}>{est.label}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewing(cert)} className="cursor-pointer">
                            <Eye className="w-4 h-4 mr-2" /> Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPdf(cert)} className="cursor-pointer">
                            <FileText className="w-4 h-4 mr-2 text-red-600" /> Descargar PDF
                          </DropdownMenuItem>
                          {isAdmin && isVigente && (
                            <>
                              <DropdownMenuItem onClick={() => setAnularTarget(cert)} className="cursor-pointer text-amber-600 focus:text-amber-700 focus:bg-amber-50">
                                <XCircle className="w-4 h-4 mr-2" /> Anular
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteTarget(cert)} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginación */}
      {(data?.total || 0) > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Mostrando {Math.min((page - 1) * limit + 1, data!.total)}-{Math.min(page * limit, data!.total)} de {data!.total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Anterior</Button>
            <span className="text-sm font-medium">{page} / {data!.totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === data!.totalPages}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* DIALOG: Formulario */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              Emitir Certificado de Crédito Presupuestario
            </DialogTitle>
            <DialogDescription>Complete los datos para congelar el saldo del PIM</DialogDescription>
          </DialogHeader>
          <CertificacionForm onSubmit={handleCreate} onCancel={() => setFormOpen(false)} isLoading={createMut.isPending} />
        </DialogContent>
      </Dialog>

      {/* DIALOG: Ver Detalles */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              Detalle del Certificado
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-5 mt-2">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div>
                  <p className="text-xs text-gray-500 uppercase">N° Certificado</p>
                  <p className="text-lg font-mono font-bold">{viewing.numero_certificado}</p>
                </div>
                <Badge variant="outline" className={`${ESTADOS_CONFIG[viewing.estado].color} px-3 py-1`}>
                  {ESTADOS_CONFIG[viewing.estado].label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500 text-xs">Entidad</p><p className="font-medium">{viewing.entidad_nombre}</p></div>
                <div><p className="text-gray-500 text-xs">Disponibilidad</p><p className="font-mono text-blue-600">{viewing.disponibilidad_numero}</p></div>
                <div><p className="text-gray-500 text-xs">Fecha Certificación</p><p className="font-medium">{format(new Date(viewing.fecha_certificacion), "d 'de' MMMM, yyyy", { locale: es })}</p></div>
                <div><p className="text-gray-500 text-xs">Año Fiscal</p><p className="font-bold">{viewing.anio_fiscal}</p></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-600 font-semibold uppercase">Monto Aprobado</p>
                  <p className="text-xl font-bold text-blue-900 tabular-nums mt-1">
                    {formatCurrency(viewing.disponibilidad_monto_aprobado)}
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-semibold uppercase">Monto Certificado</p>
                  <p className="text-xl font-bold text-emerald-900 tabular-nums mt-1">
                    {formatCurrency(viewing.monto_certificado)}
                  </p>
                </div>
              </div>

              {viewing.certificador_nombre && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Certificado por</p>
                  <p className="text-sm font-medium">{viewing.certificador_nombre}</p>
                </div>
              )}

              {viewing.observaciones && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Observaciones</p>
                  <p className="text-sm bg-gray-50 p-3 rounded border">{viewing.observaciones}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG: Anular */}
      <Dialog open={!!anularTarget} onOpenChange={(o) => !o && setAnularTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <XCircle className="w-5 h-5" /> Anular Certificación
            </DialogTitle>
            <DialogDescription>
              Certificado: <span className="font-bold">{anularTarget?.numero_certificado}</span>
            </DialogDescription>
          </DialogHeader>
          <AnularCertificacionForm
            onConfirm={handleAnular}
            onCancel={() => setAnularTarget(null)}
            isLoading={anularMut.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* DIALOG: Eliminar */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Eliminar Certificación"
        description={`¿Eliminar el certificado "${deleteTarget?.numero_certificado}"? Esta acción liberará el saldo congelado.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={deleteMut.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// Sub-componente para anular
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const anularSchema = z.object({
  observaciones: z.string().min(10, 'Debe detallar el motivo (mín. 10 caracteres)'),
});

function AnularCertificacionForm({ onConfirm, onCancel, isLoading }: { onConfirm: (obs: string) => Promise<void>; onCancel: () => void; isLoading: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(anularSchema) });
  return (
    <form onSubmit={handleSubmit(async (data) => await onConfirm(data.observaciones))} className="space-y-4 mt-2">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
        ⚠️ Al anular este certificado, el saldo congelado será liberado y podrá ser utilizado en otras certificaciones.
      </div>
      <div className="space-y-2">
        <Label>Motivo de Anulación <span className="text-red-500">*</span></Label>
        <Textarea {...register('observaciones')} placeholder="Explique el motivo..." className="min-h-25" />
        {errors.observaciones && <p className="text-xs text-red-600">{errors.observaciones.message}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
        <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={isLoading}>
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Anulando...</> : 'Confirmar Anulación'}
        </Button>
      </div>
    </form>
  );
}