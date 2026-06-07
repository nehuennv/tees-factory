import { toast } from 'sonner';

export type ErrorAudience = 'frontend' | 'backend';

export interface ErrorInfo {
    audience: ErrorAudience;
    message: string;
    status?: number;
}

/**
 * Clasifica un error para mostrarlo claro:
 *  - backend: el servidor respondió con error (4xx/5xx) o no respondió (caído/red).
 *  - frontend: error de JavaScript en el navegador (bug de render/lógica).
 */
export function getErrorInfo(error: unknown): ErrorInfo {
    const e = error as any;

    // Error de axios con respuesta del servidor
    if (e?.response) {
        const status = e.response.status as number;
        const serverMsg = e.response.data?.error || e.response.data?.message;
        return {
            audience: 'backend',
            status,
            message: serverMsg || (status >= 500 ? 'Error interno del servidor' : `Solicitud rechazada (${status})`),
        };
    }

    // Request enviado pero sin respuesta → servidor caído o problema de red
    if (e?.request) {
        return {
            audience: 'backend',
            message: 'No se pudo conectar con el servidor (sin respuesta). Puede estar caído o ser un problema de red.',
        };
    }

    // Error puro de JavaScript → bug del front
    return {
        audience: 'frontend',
        message: e?.message ? String(e.message) : String(error),
    };
}

/**
 * Muestra un toast rojo claro indicando qué falló y a quién contactar.
 * @param context texto corto opcional para ubicar dónde ocurrió (ej. "Cargar pedidos").
 */
export function notifyError(error: unknown, context?: string) {
    const { audience, message, status } = getErrorInfo(error);
    const who = audience === 'frontend' ? 'Contactá a Frontend' : 'Contactá a Backend';
    const statusTag = status ? ` [${status}]` : '';
    toast.error('Algo salió mal', {
        description: `${context ? context + ' — ' : ''}${message}${statusTag}\n${who}.`,
        duration: 8000,
    });
    // Log para depurar en consola
    console.error(`[${audience}]${context ? ' ' + context : ''}:`, error);
}
