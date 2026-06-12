export interface CentroCosto {
  id: string;
  entidad_id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  entidad_nombre?: string;
  entidad_ruc?: string;
}

export interface MetaPresupuestal {
  id: string;
  entidad_id: string;
  codigo: string;
  nombre: string;
  anio_fiscal: number;
  entidad_nombre?: string;
  entidad_ruc?: string;
}

export interface FuenteFinanciamiento {
  id: string;
  codigo: string;
  nombre: string;
  tipo_rubro?: string;
  activo: boolean;
}

export interface ImportResult {
  mensaje: string;
  exitosos: number;
  errores: number;
  detalles_error?: string[];
}


export interface Clasificador {
  id: string;
  codigo: string;
  descripcion: string;
  generica?: string;
  subgenerica?: string;
  especifica?: string;
  activo: boolean;
}