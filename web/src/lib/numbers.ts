/**
 * Convierte valores Decimal de PostgreSQL (que llegan como strings)
 * a números de JavaScript de forma segura.
 */
export const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * Formatea un número como moneda peruana (S/)
 */
export const formatCurrency = (value: unknown): string => {
  const num = toNumber(value);
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Formatea un número como porcentaje con 1 decimal
 */
export const formatPercentage = (value: unknown): string => {
  const num = toNumber(value);
  return `${num.toFixed(1)}%`;
};