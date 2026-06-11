import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  LogOut,
  User,
  Settings,
  KeyRound,
  Bell,
  Moon,
  Sun,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  collapsed?: boolean;
}

export function UserMenu({ collapsed = false }: UserMenuProps) {
  const { user, roles, logout } = useAuth();
  const { theme, setTheme } = useUIStore();
  const navigate = useNavigate();

  if (!user) return null;

  const getRoleBadgeColor = () => {
    if (roles.includes('Administrador')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (roles.includes('Analista')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (roles.includes('Auditor')) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Sesión cerrada correctamente');
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    toast.info(`Tema ${theme === 'light' ? 'oscuro' : 'claro'} activado`);
  };

  // Contenido del menú (reutilizable)
  const menuContent = (
    <PopoverContent
      align={collapsed ? 'start' : 'end'}
      side={collapsed ? 'right' : 'top'}
      sideOffset={12}
      className="w-72 p-0"
    >
      {/* Header del popover */}
      <div className="p-4 bg-linear-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-linear-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{user.username}</p>
            <p className="text-xs text-gray-600 truncate">{user.email}</p>
            <div className={cn(
              'inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full border',
              getRoleBadgeColor()
            )}>
              {roles[0]}
            </div>
          </div>
        </div>
      </div>

      {/* Opciones del menú */}
      <div className="p-2">
        <button
          onClick={() => toast.info('Perfil - Próximamente')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <User className="w-4 h-4 text-gray-500" />
          <span className="flex-1 text-left">Mi Perfil</span>
        </button>

        <button
          onClick={() => toast.info('Preferencias - Próximamente')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-4 h-4 text-gray-500" />
          <span className="flex-1 text-left">Preferencias</span>
        </button>

        <button
          onClick={() => toast.info('Cambiar contraseña - Próximamente')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <KeyRound className="w-4 h-4 text-gray-500" />
          <span className="flex-1 text-left">Cambiar Contraseña</span>
        </button>

        <button
          onClick={() => toast.info('Notificaciones - Próximamente')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="flex-1 text-left">Notificaciones</span>
          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
            3
          </span>
        </button>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-gray-500" />
          ) : (
            <Sun className="w-4 h-4 text-gray-500" />
          )}
          <span className="flex-1 text-left">
            {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
          </span>
        </button>
      </div>

      <Separator />

      {/* Footer con logout */}
      <div className="p-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span className="flex-1 text-left">Cerrar Sesión</span>
        </button>
      </div>

      {/* Versión del sistema */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-[10px] text-gray-400 text-center">
          Sistema Analítico v1.0.0 · © 2026 Perú Compras
        </p>
      </div>
    </PopoverContent>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'w-full transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-lg',
            collapsed ? 'p-2 flex flex-col items-center gap-1' : 'p-3 flex items-center gap-3'
          )}
          aria-label="Abrir menú de usuario"
        >
          {collapsed ? (
            <>
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <ChevronUp className="w-3 h-3 text-gray-400" />
            </>
          ) : (
            <>
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold shrink-0 shadow-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
                <div className={cn(
                  'inline-block mt-0.5 px-2 py-0.5 text-[10px] font-medium rounded-full border truncate max-w-full',
                  getRoleBadgeColor()
                )}>
                  {roles[0]}
                </div>
              </div>
              <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
            </>
          )}
        </button>
      </PopoverTrigger>
      {menuContent}
    </Popover>
  );
}