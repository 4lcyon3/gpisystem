import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, AlertCircle, CheckCircle2, Bell } from 'lucide-react';
import type { Alerta } from '@/hooks/useDashboard';
import { cn } from '@/lib/utils';

interface AlertasPanelProps {
  data: Alerta[] | undefined;
  isLoading: boolean;
}

const nivelConfig = {
  rojo: {
    icon: AlertCircle,
    color: 'bg-red-50 border-red-200 text-red-800',
    iconColor: 'text-red-500',
    badge: 'bg-red-100 text-red-800 border-red-200',
    label: 'Crítica',
  },
  amarillo: {
    icon: AlertTriangle,
    color: 'bg-amber-50 border-amber-200 text-amber-800',
    iconColor: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    label: 'Advertencia',
  },
  verde: {
    icon: CheckCircle2,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    iconColor: 'text-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    label: 'OK',
  },
};

export function AlertasPanel({ data, isLoading }: AlertasPanelProps) {
  if (isLoading) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const alertas = data || [];
  const rojas = alertas.filter((a) => a.nivel === 'rojo');
  const amarillas = alertas.filter((a) => a.nivel === 'amarillo');
  const verdes = alertas.filter((a) => a.nivel === 'verde');

  const renderAlerta = (alerta: Alerta) => {
    const config = nivelConfig[alerta.nivel];
    const Icon = config.icon;

    return (
      <div
        key={`${alerta.tipo_alerta}-${alerta.entidad_nombre}`}
        className={cn('p-3 rounded-lg border', config.color)}
      >
        <div className="flex items-start gap-3">
          <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', config.iconColor)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-semibold truncate">{alerta.tipo_alerta}</span>
              <Badge variant="outline" className={cn('text-[10px] shrink-0', config.badge)}>
                {config.label}
              </Badge>
            </div>
            <p className="text-xs opacity-90 line-clamp-2">{alerta.mensaje}</p>
            {alerta.entidad_nombre && (
              <p className="text-[10px] opacity-75 mt-1 truncate">
                📍 {alerta.entidad_nombre}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
      <Bell className="w-8 h-8 mb-2" />
      <p className="text-sm">No hay alertas de este tipo</p>
    </div>
  );

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Semáforo de Alertas
        </CardTitle>
        <CardDescription>
          {rojas.length} críticas · {amarillas.length} advertencias · {verdes.length} OK
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rojo" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rojo" className="text-xs">
              Críticas ({rojas.length})
            </TabsTrigger>
            <TabsTrigger value="amarillo" className="text-xs">
              Advertencias ({amarillas.length})
            </TabsTrigger>
            <TabsTrigger value="verde" className="text-xs">
              OK ({verdes.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="rojo" className="mt-4 space-y-2 max-h-100 overflow-y-auto">
            {rojas.length > 0 ? rojas.map(renderAlerta) : renderEmptyState()}
          </TabsContent>
          
          <TabsContent value="amarillo" className="mt-4 space-y-2 max-h-100 overflow-y-auto">
            {amarillas.length > 0 ? amarillas.map(renderAlerta) : renderEmptyState()}
          </TabsContent>
          
          <TabsContent value="verde" className="mt-4 space-y-2 max-h-100 overflow-y-auto">
            {verdes.length > 0 ? verdes.map(renderAlerta) : renderEmptyState()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}