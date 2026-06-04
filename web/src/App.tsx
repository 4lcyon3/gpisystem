import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { ModulePlaceholderPage } from '@/pages/ModulePlaceholderPage';
import { MainLayout } from '@/components/layout/MainLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function AppContent() {
  const { isAuthenticated, isLoading, fetchUser, fetchMenu } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      try {
        await fetchUser();
        await fetchMenu();
      } catch (error) {
        // No hay sesión activa, es normal al primer load
        console.log('No hay sesión activa:', error);
      }
    };
    init();
  }, [fetchUser, fetchMenu]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando aplicación</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      {/* Rutas Protegidas con Layout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Módulos 1-15 (usarán ModulePlaceholderPage por ahora) */}
        <Route path="/configuracion" element={<ModulePlaceholderPage />} />
        <Route path="/pei" element={<ModulePlaceholderPage />} />
        <Route path="/poi" element={<ModulePlaceholderPage />} />
        <Route path="/programacion" element={<ModulePlaceholderPage />} />
        <Route path="/presupuesto" element={<ModulePlaceholderPage />} />
        <Route path="/disponibilidad" element={<ModulePlaceholderPage />} />
        <Route path="/certificacion" element={<ModulePlaceholderPage />} />
        <Route path="/modificaciones" element={<ModulePlaceholderPage />} />
        <Route path="/ejecucion" element={<ModulePlaceholderPage />} />
        <Route path="/metas-fisicas" element={<ModulePlaceholderPage />} />
        <Route path="/alertas" element={<ModulePlaceholderPage />} />
        <Route path="/evaluacion" element={<ModulePlaceholderPage />} />
        <Route path="/documentos" element={<ModulePlaceholderPage />} />
        <Route path="/reportes" element={<ModulePlaceholderPage />} />
      </Route>

      {/* Rutas protegidas con roles específicos (ejemplo para Configuración) */}
      {/* 
      <Route
        path="/configuracion"
        element={
          <ProtectedRoute allowedRoles={['Administrador']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ConfiguracionPage />} />
      </Route>
      */}

      {/* Página de No Autorizado */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Redirects */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            duration: 3000,
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;