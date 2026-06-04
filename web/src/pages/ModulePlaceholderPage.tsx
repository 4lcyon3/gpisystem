import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ModulePlaceholderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { menu } = useAuth();

  // Encontrar el nombre del módulo basado en la ruta actual
  const currentModule = menu.find((item) => item.ruta === location.pathname);
  const moduleName = currentModule?.nombre || 'Módulo';

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Dashboard
        </Button>

        <Card className="border-dashed">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Construction className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Módulo: {moduleName}</CardTitle>
            <CardDescription className="text-base">
              Este módulo está en desarrollo. Pronto estará disponible.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-blue-900 mb-3">
                Próximas funcionalidades:
              </h3>
              <ul className="text-sm text-blue-800 space-y-2 text-left">
                <li>✓ Formularios de creación y edición</li>
                <li>✓ Tablas con paginación y filtros</li>
                <li>✓ Búsquedas avanzadas</li>
                <li>✓ Exportación a Excel/PDF</li>
                <li>✓ Validaciones de negocio</li>
              </ul>
            </div>

            <p className="text-sm text-gray-500 mt-6">
              Ruta actual: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{location.pathname}</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}