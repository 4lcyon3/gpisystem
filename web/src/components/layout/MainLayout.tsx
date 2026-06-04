import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { MobileSidebar } from './MobileSidebar';
import { MobileMenuButton } from './MobileMenuButton';

export function MainLayout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Desktop (siempre visible, colapsable) */}
      <div className="hidden lg:flex">
        <AppSidebar />
      </div>

      {/* Sidebar Móvil (Drawer) */}
      <MobileSidebar />
      
      {/* Botón flotante para abrir en móvil (solo cuando está cerrado) */}
      <MobileMenuButton />

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}