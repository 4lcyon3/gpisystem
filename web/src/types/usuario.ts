import { z } from 'zod';

export const ROLES_SISTEMA = ['Administrador', 'Analista', 'Auditor'] as const;
export type RolSistema = (typeof ROLES_SISTEMA)[number];

// Schema para CREAR usuario (password requerido)
export const usuarioCreateSchema = z.object({
  username: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Solo letras, números, guiones y puntos'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
  roles: z.array(z.enum(ROLES_SISTEMA)).min(1, 'Debe asignar al menos un rol'),
  activo: z.boolean().default(true),
});

// Schema para EDITAR usuario (password opcional)
export const usuarioUpdateSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial')
    .optional()
    .or(z.literal('')),
  roles: z.array(z.enum(ROLES_SISTEMA)).min(1, 'Debe tener al menos un rol'),
  activo: z.boolean().default(true),
});

export type UsuarioCreateValues = z.infer<typeof usuarioCreateSchema>;
export type UsuarioUpdateValues = z.infer<typeof usuarioUpdateSchema>;

export interface UsuarioEntity {
  id: string;
  username: string;
  email: string;
  activo: boolean;
  roles: string[];
  creado_en: string;
  actualizado_en?: string;
}

export interface UseUsuariosOptions {
  includeInactive?: boolean;
}