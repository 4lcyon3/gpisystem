import { useEffect, useRef } from 'react';
import { api } from '@/lib/axios';

interface UseSSEOptions<T = unknown> {
  url: string;
  onMessage: (data: T) => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
}

/**
 * Hook SSE estable que NO se reconecta cuando onMessage cambia.
 * Usa refs para mantener callbacks estables.
 */
export function useSSE<T = unknown>({
  url,
  onMessage,
  onError,
  enabled = true,
}: UseSSEOptions<T>) {
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // ✅ Usar refs para callbacks (no causan re-renders)
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  
  // Actualizar refs cuando cambien los callbacks
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // URL completa
  const fullUrl = `${api.defaults.baseURL?.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;

  useEffect(() => {
    if (!enabled || !url) return;

    console.log(`[SSE] Conectando a: ${fullUrl}`);
    
    const eventSource = new EventSource(fullUrl, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as T;
        // Llamar al callback más reciente vía ref
        onMessageRef.current(data);
      } catch (err) {
        console.error('[SSE] Error parseando mensaje:', err);
      }
    };

    eventSource.onerror = (event) => {
      console.error('[SSE] Error de conexión:', event);
      onErrorRef.current?.(event);
      // ❌ NO reintentar automáticamente (causaba bucle)
      // El usuario puede cerrar el modal y volver a intentar
      eventSource.close();
    };

    eventSource.onopen = () => {
      console.log('[SSE] Conexión establecida');
    };

    eventSourceRef.current = eventSource;

    // Cleanup al desmontar o cambiar enabled/url
    return () => {
      console.log('[SSE] Cerrando conexión');
      eventSource.close();
      eventSourceRef.current = null;
    };
    // ✅ Solo reconectar si cambia enabled o url
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, url]);

  return {
    disconnect: () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    },
  };
}