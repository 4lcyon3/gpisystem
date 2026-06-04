import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { SidebarItem } from './SidebarItem';
import { SidebarToggleButton } from './SidebarToggleButton';
import { Shield } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  isMobile?: boolean;
}

export function AppSidebar({ isMobile = false }: AppSidebarProps) {
  const { user, roles, menu } = useAuth();
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();

  // En móvil siempre está expandido
  const collapsed = isMobile ? false : sidebarCollapsed;

  const getRoleBadgeColor = () => {
    if (roles.includes('Administrador')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (roles.includes('Analista')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (roles.includes('Auditor')) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <aside
      className={cn(
        'flex flex-col bg-white border-r border-gray-200 h-full',
        'transition-all duration-300',
        isMobile ? 'w-64' : (collapsed ? 'w-20' : 'w-64')
      )}
    >
      {/* Header: Logo + Botón Toggle (solo en desktop) */}
      <div className={cn(
        'h-16 flex items-center border-b border-gray-200 px-4 shrink-0',
        collapsed && !isMobile ? 'justify-center' : 'justify-between'
      )}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-gray-900 truncate">Sistema Analítico</span>
              <span className="text-xs text-gray-500 truncate">Perú Compras</span>
            </div>
          )}
        </div>

        {/* Botón Toggle INTEGRADO (solo en desktop) */}
        {!isMobile && (
          <SidebarToggleButton
            collapsed={collapsed}
            onClick={toggleSidebarCollapse}
          />
        )}
      </div>

      {/* Menú de Navegación */}
      <ScrollArea className="flex-1 py-4">
        <nav className={cn('px-3 space-y-1', collapsed && !isMobile && 'px-2')}>
          {menu.map((item, index) => {
            const showSeparator = (!collapsed || isMobile) && item.nombre === 'Configuración' && index > 0;
            
            return (
              <div key={item.id}>
                {showSeparator && (
                  <>
                    <Separator className="my-3" />
                    <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Administración
                    </p>
                  </>
                )}
                <SidebarItem 
                  item={item} 
                  collapsed={collapsed && !isMobile}
                  onClick={() => {
                    // En móvil, cerrar el sidebar al hacer clic en un item
                    if (isMobile) {
                      useUIStore.getState().setSidebarOpen(false);
                    }
                  }}
                />
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer: Usuario */}
      {user && (
        <div className={cn(
          'border-t border-gray-200 shrink-0',
          collapsed && !isMobile ? 'p-2' : 'p-4'
        )}>
          {(!collapsed || isMobile) ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
                <div className={cn(
                  'inline-block mt-0.5 px-2 py-0.5 text-xs font-medium rounded-full border truncate max-w-full',
                  getRoleBadgeColor()
                )}>
                  {roles[0]}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className={cn(
                'w-full px-1 py-0.5 text-[10px] font-medium rounded-full border text-center truncate',
                getRoleBadgeColor()
              )}>
                {roles[0]?.substring(0, 5)}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}