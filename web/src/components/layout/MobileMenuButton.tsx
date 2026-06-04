import { useUIStore } from '@/stores/uiStore';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileMenuButton() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  // Solo visible en móvil cuando el sidebar está cerrado
  if (sidebarOpen) return null;

  return (
    <button
      onClick={() => setSidebarOpen(true)}
      className={cn(
        'lg:hidden fixed top-4 left-4 z-30',
        'flex items-center justify-center',
        'w-10 h-10 rounded-lg',
        'bg-white border border-gray-200 shadow-md',
        'hover:bg-blue-50 hover:border-blue-300',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500'
      )}
      aria-label="Abrir menú"
    >
      <Menu className="w-5 h-5 text-gray-700" />
    </button>
  );
}