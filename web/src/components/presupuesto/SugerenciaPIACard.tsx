import { Lightbulb, TrendingUp } from 'lucide-react';
import { useSugerenciaPIA } from '@/hooks/useProgramacion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  entidadId: string;
  anioFiscal: number;
  onAplicarSugerencia?: (monto: number) => void;
}

const TIPOS_LABELS: Record<string, string> = {
  proyecto: 'Proyecto',
  actividad: 'Actividad',
  inversion: 'Inversión',
  servicio: 'Servicio',
};

export function SugerenciaPIACard({ entidadId, anioFiscal, onAplicarSugerencia }: Props) {
  const { data, isLoading } = useSugerenciaPIA(entidadId, anioFiscal);

  if (!entidadId || !anioFiscal) return null;
  if (isLoading) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 text-sm text-amber-700">
          Cargando sugerencias de programaciones aprobadas...
        </CardContent>
      </Card>
    );
  }

  if (!data || data.cantidad_programas === 0) return null;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(v);

  return (
    <Card className="border-amber-300 bg-linear-to-br from-amber-50 to-yellow-50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 bg-amber-200 rounded-lg flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4 text-amber-700" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              Sugerencia basada en Programación Multianual
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                {data.cantidad_programas} programa(s)
              </Badge>
            </h4>
            <p className="text-xs text-amber-700 mt-1">
              Existen programaciones aprobadas que incluyen el año {anioFiscal}.
              Considere estos montos como referencia para el PIA.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {data.sugerencias.map((s) => (
            <div
              key={s.programacion_id}
              className="flex items-center justify-between p-2 bg-white/60 rounded-lg border border-amber-200"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{s.nombre}</p>
                <p className="text-xs text-gray-500">{TIPOS_LABELS[s.tipo] || s.tipo}</p>
              </div>
              <div className="text-right ml-3 shrink-0">
                <p className="text-sm font-bold text-amber-900 tabular-nums">
                  {formatCurrency(s.monto_sugerido)}
                </p>
                {onAplicarSugerencia && (
                  <button
                    onClick={() => onAplicarSugerencia(s.monto_sugerido)}
                    className="text-xs text-amber-700 hover:text-amber-900 underline mt-0.5"
                  >
                    Aplicar monto
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-amber-300">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-semibold text-amber-900">Total sugerido para {anioFiscal}:</span>
          </div>
          <span className="text-lg font-bold text-amber-900 tabular-nums">
            {formatCurrency(data.total_sugerido)}
          </span>
        </div>

        {onAplicarSugerencia && (
          <button
            onClick={() => onAplicarSugerencia(data.total_sugerido)}
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Aplicar total sugerido al PIA
          </button>
        )}
      </CardContent>
    </Card>
  );
}