import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { MainLayout } from '@/components/layout/MainLayout';
import { ErrorBoundary } from './components/errors/ErrorBoundary';
import { CargasPage } from './pages/CargasPage';
import { PeiPage } from '@/pages/PeiPage';
import { ConfiguracionPage } from '@/pages/ConfiguracionPage';
import { PoiPage } from '@/pages/PoiPage';
import { PresupuestoPage } from '@/pages/PresupuestoPage';
import { ModificacionesPage } from '@/pages/ModificacionesPage';
import { DisponibilidadPage } from '@/pages/DisponibilidadPage';
import { CatalogosPage } from '@/pages/CatalogosPage';
import { CertificacionesPage } from '@/pages/CertificacionesPage';
import { AvancesPage } from '@/pages/AvancesPage';
import { ProgramacionPage } from '@/pages/ProgramacionPage';
import { EvaluacionPage } from '@/pages/EvaluacionPage';

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
            <ErrorBoundary>
              <MainLayout />
            </ErrorBoundary>
          </ProtectedRoute>
          }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Módulos 1-15 (usarán ModulePlaceholderPage por ahora) */}
        <Route
          path="/configuracion"
          element={
            <ProtectedRoute allowedRoles={['Administrador', 'Analista']}>
              <ConfiguracionPage />
            </ProtectedRoute>
          }
        />
        <Route path="/pei" element={<PeiPage />} />
        <Route path="/poi" element={<PoiPage />} />
        <Route path="/catalogos" element={<CatalogosPage />} />
        <Route path="/programacion" element={<ProgramacionPage />} />
        <Route path="/presupuesto" element={<PresupuestoPage />} />
        <Route path="/disponibilidad" element={<DisponibilidadPage />} />
        <Route path="/certificaciones" element={<CertificacionesPage />} />
        <Route path="/modificaciones" element={<ModificacionesPage />} />
        <Route path="/ejecucion" element={<CargasPage />} />
        <Route path="/avances" element={<AvancesPage />} />
        <Route path="/evaluacion" element={<EvaluacionPage />} />
      </Route>

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