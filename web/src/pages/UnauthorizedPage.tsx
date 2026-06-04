import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="text-center max-w-md">
        <ShieldX className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Acceso Denegado
        </h1>
        <p className="text-gray-600 mb-8">
          No tienes los permisos necesarios para acceder a esta sección del sistema.
          Contacta al administrador si crees que esto es un error.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate('/dashboard')}>
            Volver al Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Regresar
          </Button>
        </div>
      </div>
    </div>
  );
}