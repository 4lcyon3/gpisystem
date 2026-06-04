import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, LayoutDashboard, Users, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function DashboardPage() {
  const { user, roles, permissions, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Sesión cerrada correctamente');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-blue-600" />
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenido, <span className="font-semibold">{user?.username}</span>
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Info del Usuario */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Información de Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Usuario</p>
                <p className="font-semibold">{user?.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Roles</p>
                <div className="flex gap-2 mt-1">
                  {roles.map((role) => (
                    <span
                      key={role}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Permisos</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {permissions.can_edit && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      ✏️ Editar
                    </span>
                  )}
                  {permissions.can_upload && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      📤 Subir Archivos
                    </span>
                  )}
                  {permissions.can_configure && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                      ⚙️ Configurar
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder para próximos módulos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Módulos del Sistema
            </CardTitle>
            <CardDescription>
              En la Fase 2 construiremos el Sidebar dinámico con los 15 módulos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                'Configuración', 'PEI', 'POI', 'Programación', 'Presupuesto',
                'Disponibilidad', 'Certificación', 'Modificaciones', 'Ejecución',
                'Metas Físicas', 'Alertas', 'Evaluación', 'Documentos',
                'Reportes', 'Dashboard'
              ].map((modulo, idx) => (
                <div
                  key={idx}
                  className="p-3 border rounded-lg text-center text-sm text-gray-600 hover:bg-gray-50"
                >
                  {modulo}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}