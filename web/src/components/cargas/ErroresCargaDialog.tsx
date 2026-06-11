import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Download, FileX } from 'lucide-react';
import { useErroresCarga } from '@/hooks/useCargas';

interface ErroresCargaDialogProps {
  cargaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ErroresCargaDialog({
  cargaId,
  open,
  onOpenChange,
}: ErroresCargaDialogProps) {
  const { data: errores, isLoading } = useErroresCarga(cargaId);

  const handleDownloadCSV = () => {
    if (!errores || errores.length === 0) return;

    const headers = ['Fila', 'Estado', 'Mensaje de Error'];
    const rows = errores.map((e) => [
      e.numero_fila,
      e.estado,
      `"${(e.mensaje_error || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `errores_carga_${cargaId?.slice(0, 8)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Filas con Errores
          </DialogTitle>
          <DialogDescription>
            {errores?.length || 0} fila{(errores?.length || 0) !== 1 ? 's' : ''}{' '}
            no {(errores?.length || 0) !== 1 ? 'pudieron' : 'pudo'} ser
            procesada{(errores?.length || 0) !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : errores && errores.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Fila</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Mensaje de Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errores.map((error, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-sm font-semibold text-gray-900">
                      #{error.numero_fila}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        {error.estado}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {error.mensaje_error || 'Error desconocido'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileX className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                No hay errores registrados para esta carga
              </p>
            </div>
          )}
        </div>

        {errores && errores.length > 0 && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            <Button onClick={handleDownloadCSV}>
              <Download className="w-4 h-4 mr-2" />
              Descargar CSV
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}