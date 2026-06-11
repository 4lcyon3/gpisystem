import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { SidebarItem } from './SidebarItem';
import { SidebarToggleButton } from './SidebarToggleButton';
import { Shield } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { UserMenu } from './UserMenu';

interface AppSidebarProps {
  isMobile?: boolean;
}

export function AppSidebar({ isMobile = false }: AppSidebarProps) {
  const { user, menu } = useAuth();
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();

  // En móvil siempre está expandido
  const collapsed = isMobile ? false : sidebarCollapsed;


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

       {user && (
        <div className={cn(
          'border-t border-gray-200 shrink-0',
          collapsed && !isMobile ? 'p-2' : 'p-3'
        )}>
          <UserMenu collapsed={collapsed && !isMobile} />
        </div>
      )}
    </aside>
);
}