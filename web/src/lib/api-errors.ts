/**
 * Extrae un mensaje de error legible de respuestas de FastAPI.
 * Maneja tanto errores 422 (validación) como errores simples.
 */
export function extractApiError(err: any): string {
  const data = err?.response?.data;
  if (!data) return 'Error de conexión con el servidor';

  // Error de validación de Pydantic (422)
  if (Array.isArray(data.detail)) {
    const messages = data.detail.map((e: any) => {
      const field = e.loc?.[e.loc.length - 1] || 'campo';
      return `${field}: ${e.msg}`;
    });
    return `Error de validación:\n• ${messages.join('\n• ')}`;
  }

  // Error simple (400, 404, 500)
  if (typeof data.detail === 'string') {
    return data.detail;
  }

  return 'Error desconocido del servidor';
}