import { useUIStore } from '@/stores/uiStore';
import { AppSidebar } from './AppSidebar';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  // Bloquear scroll del body cuando el sidebar está abierto
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <>
      {/* Overlay oscuro */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden',
          'transition-opacity duration-300',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer del sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 lg:hidden',
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="relative h-full">
          {/* Botón de cierre integrado en la esquina superior derecha del drawer */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="absolute top-3 right-3 z-10 h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <AppSidebar isMobile />
        </div>
      </div>
    </>
  );
}