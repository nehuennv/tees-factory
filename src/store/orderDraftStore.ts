import { create } from 'zustand';
import { useCartStore } from './cartStore';

/**
 * Contexto de borrador de pedido para el vendedor.
 *
 * Este store NO almacena items — para eso se reutiliza `cartStore`.
 * Su única responsabilidad es trackear *para qué cliente* se está
 * armando el pedido, permitiendo al resto de la app reaccionar
 * condicionalmente (banner, checkout, rutas).
 *
 * Ciclo de vida:
 *   1. Seller hace clic en "Nuevo Pedido" en la cartera → `startDraft()`
 *   2. Navega por el catálogo, agrega items al cart normalmente.
 *   3. Confirma el pedido → `clearDraft()` limpia contexto + cart.
 *   4. O cancela → `clearDraft()` también limpia todo.
 */

export interface OrderDraftState {
    /** ID del cliente para el que se está armando el pedido */
    clientId: string | null;
    /** Nombre visible del cliente (para UI) */
    clientName: string | null;
    /** Timestamp ISO de cuándo se inició el borrador */
    startedAt: string | null;
    /** Indica si hay un borrador activo */
    isActive: boolean;

    /** Inicia un nuevo borrador de pedido para un cliente específico */
    startDraft: (clientId: string, clientName: string) => void;
    /** Limpia el borrador y el carrito asociado */
    clearDraft: () => void;
}

export const useOrderDraftStore = create<OrderDraftState>((set) => ({
    clientId: null,
    clientName: null,
    startedAt: null,
    isActive: false,

    startDraft: (clientId, clientName) => {
        // Limpiar carrito anterior antes de empezar pedido nuevo
        useCartStore.getState().clearCart();

        set({
            clientId,
            clientName,
            startedAt: new Date().toISOString(),
            isActive: true,
        });
    },

    clearDraft: () => {
        useCartStore.getState().clearCart();

        set({
            clientId: null,
            clientName: null,
            startedAt: null,
            isActive: false,
        });
    },
}));
