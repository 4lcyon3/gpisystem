import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Shield, FileText, BarChart3, Eye, EyeOff, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Si venimos de una ruta protegida, volver allí después del login
  const from = (location.state as unknown as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
  const currentYear = new Date().getFullYear();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      toast.success('¡Bienvenido!', {
        description: 'Inicio de sesión exitoso',
      });
      navigate(from, { replace: true });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Error al iniciar sesión';
      toast.error('Error de autenticación', {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado Izquierdo: Branding con Degradado Oscuro */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-slate-900 via-blue-900 to-slate-800 relative overflow-hidden">
        {/* Patrón decorativo de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          {/* Logo y Título */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Shield className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Sistema Analítico</h1>
                <p className="text-blue-200 text-sm">de Compras Públicas</p>
              </div>
            </div>
          </div>

          {/* Descripción Principal */}
          <div className="space-y-6 mb-12">
            <h2 className="text-4xl font-bold leading-tight">
              Inteligencia de datos para la gestión pública
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed">
              Plataforma de Business Intelligence diseñada para consolidar, analizar 
              y visualizar el ciclo completo de la ejecución presupuestal institucional.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Dashboards en Tiempo Real</h3>
                <p className="text-sm text-blue-200">
                  Visualiza KPIs, ejecución presupuestal y alertas institucionales
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Gestión Integral</h3>
                <p className="text-sm text-blue-200">
                  15 módulos que cubren desde la planificación estratégica hasta la ejecución
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Seguridad Empresarial</h3>
                <p className="text-sm text-blue-200">
                  Control de acceso basado en roles con autenticación segura
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-sm text-blue-200">
              © {currentYear} Perú Compras. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Formulario de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Logo para móvil */}
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Sistema Analítico</h1>
            <p className="text-sm text-gray-600">de Compras Públicas</p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="text-2xl font-bold text-center">
                Iniciar Sesión
              </CardTitle>
              <CardDescription className="text-center text-base">
                Ingresa tus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">Usuario</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <Input id="username" type="text" placeholder="ej: MEFCARPE" className="pl-10 h-11" {...register('username')} disabled={isSubmitting} />
                  </div>
                  {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 h-11" {...register('password')} disabled={isSubmitting} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Ingresar al Sistema'
                  )}
                </Button>
              </form>

              {/* Información de la aplicación */}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-900 mb-2">
                  Novedades del sistema
                </p>

                <div className="space-y-1 text-xs text-blue-800">
                  <div className="flex justify-between">
                    <span className="font-medium">Versión:</span>
                    <span className="font-mono">v1.0.0</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium">Última actualización:</span>
                    <span className="font-mono">Jun 2026</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-500 mt-6">
            ¿Problemas para acceder? Contacta al administrador del sistema
          </p>
        </div>
      </div>
    </div>
  );
}