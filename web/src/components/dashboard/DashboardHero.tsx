import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar, Clock, TrendingUp } from 'lucide-react';

interface DashboardHeroProps {
  anio: number;
}

function getGreeting(): { text: string; icon: string; color: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Buenos días', icon: '☀️', color: 'from-amber-400 to-orange-500' };
  if (hour < 19) return { text: 'Buenas tardes', icon: '🌤️', color: 'from-blue-400 to-cyan-500' };
  return { text: 'Buenas noches', icon: '🌙', color: 'from-indigo-500 to-purple-600' };
}

export function DashboardHero({ anio }: DashboardHeroProps) {
  const { user, roles } = useAuth();
  const greeting = getGreeting();
  
  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg mb-6 bg-linear-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Patrón decorativo de fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Círculos decorativos */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

      <div className="relative p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Lado izquierdo: Saludo y título */}
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{greeting.icon}</span>
              <span className="text-sm font-medium text-blue-200 capitalize">
                {greeting.text},
              </span>
              <span className="text-sm font-bold text-white">
                {user?.username}
              </span>
              {roles.includes('Administrador') && (
                <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-400/30 text-[10px]">
                  <Sparkles className="w-3 h-3 mr-1" />
                  ADMIN
                </Badge>
              )}
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-300" />
              Dashboard Ejecutivo
            </h1>

            <p className="text-blue-100 text-sm lg:text-base max-w-2xl">
              Vista consolidada de la ejecución presupuestal institucional.
              Analiza el rendimiento, identifica oportunidades y toma decisiones basadas en datos.
            </p>
          </div>

          {/* Lado derecho: Información contextual */}
          <div className="flex flex-wrap gap-3">
            {/* Año fiscal */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white">
              <div className="flex items-center gap-2 text-xs text-blue-200 mb-1">
                <Calendar className="w-3 h-3" />
                <span>Año Fiscal</span>
              </div>
              <p className="text-2xl font-bold tabular-nums">{anio}</p>
            </div>

            {/* Fecha actual */}
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white">
              <div className="flex items-center gap-2 text-xs text-blue-200 mb-1">
                <Clock className="w-3 h-3" />
                <span>Hoy</span>
              </div>
              <p className="text-sm font-semibold capitalize max-w-45 truncate">
                {today}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}