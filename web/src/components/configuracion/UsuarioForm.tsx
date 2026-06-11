/* eslint-disable react-hooks/incompatible-library */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  usuarioCreateSchema,
  usuarioUpdateSchema,
  ROLES_SISTEMA,
  type UsuarioCreateValues,
  type UsuarioUpdateValues,
  type RolSistema,
} from '@/types/usuario';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Shield, UserCog, Eye } from 'lucide-react';

interface UsuarioFormProps {
  mode: 'create' | 'edit';
  defaultValues?: {
    username?: string;
    email?: string;
    roles?: string[];
    activo?: boolean;
  };
  onSubmit: (data: UsuarioCreateValues | UsuarioUpdateValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ROLES_INFO: Record<RolSistema, { icon: typeof Shield; color: string; description: string }> = {
  Administrador: { icon: Shield, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', description: 'Acceso total al sistema' },
  Analista: { icon: UserCog, color: 'text-blue-600 bg-blue-50 border-blue-200', description: 'Carga y gestiona datos' },
  Auditor: { icon: Eye, color: 'text-green-600 bg-green-50 border-green-200', description: 'Solo lectura y reportes' },
};

export function UsuarioForm({ mode, defaultValues, onSubmit, onCancel, isLoading }: UsuarioFormProps) {
  const schema = mode === 'create' ? usuarioCreateSchema : usuarioUpdateSchema;

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      roles: [],
      activo: true,
      ...defaultValues,
    },
  });

  useEffect(() => {
    reset({
      username: defaultValues?.username || '',
      email: defaultValues?.email || '',
      password: '',
      roles: defaultValues?.roles || [],
      activo: defaultValues?.activo ?? true,
    });
  }, [defaultValues, reset]);

  const rolesSeleccionados: string[] = watch('roles') || [];
  const activo = watch('activo');

  const toggleRol = (rol: RolSistema, checked: boolean) => {
    const nuevos = checked
      ? [...rolesSeleccionados, rol]
      : rolesSeleccionados.filter((r) => r !== rol);
    setValue('roles', nuevos, { shouldValidate: true });
  };

  const handleFormSubmit = (values: any) => {
    // Si estamos editando y password está vacío, lo quitamos del payload
    if (mode === 'edit' && !values.password) {
      const { password, ...rest } = values;
      onSubmit(rest);
    } else {
      onSubmit(values);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="username">Usuario <span className="text-red-500">*</span></Label>
          <Input
            id="username"
            {...register('username')}
            placeholder="juan.perez"
            disabled={mode === 'edit'}
          />
          {errors.username && <p className="text-xs text-red-600 mt-1">{errors.username.message as string}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
          <Input id="email" type="email" {...register('email')} placeholder="correo@perucompras.gob.pe" />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message as string}</p>}
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="password">
            {mode === 'create' ? 'Contraseña' : 'Nueva Contraseña (dejar vacío para no cambiar)'} <span className={mode === 'create' ? 'text-red-500' : ''}>*</span>
          </Label>
          <Input id="password" type="password" {...register('password')} placeholder="Mín. 8 caracteres, mayús., núm. y especial" />
          {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message as string}</p>}
        </div>
      </div>

      {/* Roles */}
      <div>
        <Label className="mb-3 block">
          Roles del Sistema <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {ROLES_SISTEMA.map((rol) => {
            const info = ROLES_INFO[rol];
            const Icon = info.icon;
            const checked = rolesSeleccionados.includes(rol);
            return (
              <label
                key={rol}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  checked ? info.color + ' border-2' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) => toggleRol(rol, c as boolean)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-semibold">{rol}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{info.description}</p>
                </div>
              </label>
            );
          })}
        </div>
        {errors.roles && <p className="text-xs text-red-600 mt-2">{(errors.roles as any).message || (errors.roles as any)?.root?.message}</p>}
      </div>

      {/* Estado activo */}
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="activo"
          checked={activo}
          onCheckedChange={(checked) => setValue('activo', checked as boolean)}
        />
        <Label htmlFor="activo" className="cursor-pointer">
          Usuario activo
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
          {isLoading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
          ) : mode === 'create' ? 'Crear Usuario' : 'Actualizar Usuario'}
        </Button>
      </div>
    </form>
  );
}