import { z } from 'zod';

export const entidadSchema = z.object({
  ruc: z.string()
    .min(11, 'El RUC debe tener 11 dígitos')
    .max(11, 'El RUC debe tener 11 dígitos')
    .regex(/^\d{11}$/, 'El RUC solo debe contener números'),
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  sector: z.string().max(100).optional().or(z.literal('')),
  nivel_gobierno: z.enum(['Nacional', 'Regional', 'Local']).optional().or(z.literal('')),
  activo: z.boolean().default(true),
});

export type EntidadFormValues = z.infer<typeof entidadSchema>;

export interface EntidadEntity {
  id: string;
  ruc: string;
  nombre: string;
  sector?: string;
  nivel_gobierno?: string;
  activo: boolean;
  creado_en: string;
  actualizado_en?: string;
}

export interface UseEntidadesOptions {
  includeInactive?: boolean;
  enabled?: boolean;
}