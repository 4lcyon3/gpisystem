import { z } from 'zod';

export const ESTADOS_CERTIFICACION = ['vigente', 'anulada', 'ejecutada'] as const;
export type EstadoCertificacion = (typeof ESTADOS_CERTIFICACION)[number];

export const certificacionSchema = z.object({
  entidad_id: z.string().uuid('Seleccione una entidad'),
  disponibilidad_id: z.string().uuid('Seleccione una disponibilidad aprobada'),
  numero_certificado: z.string().min(3, 'Mínimo 3 caracteres').max(50),
  monto_certificado: z.coerce.number().min(0.01, 'Debe ser mayor a 0'),
  fecha_certificacion: z.string().min(1, 'La fecha es requerida'),
  anio_fiscal: z.coerce.number().min(2000).max(2100),
  observaciones: z.string().optional().or(z.literal('')),
});

export type CertificacionFormValues = z.infer<typeof certificacionSchema>;

export interface CertificacionEntity {
  id: string;
  entidad_id: string;
  disponibilidad_id: string;
  numero_certificado: string;
  monto_certificado: number;
  fecha_certificacion: string;
  anio_fiscal: number;
  estado: EstadoCertificacion;
  observaciones?: string;
  certificado_por?: string;
  creado_en: string;
  actualizado_en?: string;
  // JOINs
  entidad_nombre?: string;
  disponibilidad_numero?: string;
  disponibilidad_monto_aprobado?: number;
  certificador_nombre?: string;
}

export interface CertificacionPaginatedResponse {
  data: CertificacionEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CertificacionListParams {
  page: number;
  limit: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  entidad_id?: string;
  estado?: string;
  anio_fiscal?: number;
}