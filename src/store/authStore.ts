import { create } from 'zustand';
import apiClient from '@/lib/apiClient';
import { useOrderDraftStore } from './orderDraftStore';

export type Role = 'ADMIN' | 'CLIENT' | 'SELLER';

export interface User {
    id: string;
    email: string;
    role: Role;
    /** UUID del perfil asociado (CLIENTS o SELLERS). null para ADMIN. */
    reference_id: string | null;
}

// ── Leer sesión del JWT en localStorage de forma síncrona ──────────────────
// Se ejecuta UNA sola vez al importar el módulo, antes de cualquier render.
function readSessionFromToken(): { user: User | null; isAuthenticated: boolean } {
    try {
        const token = localStorage.getItem('jwt_token');
        if (!token) return { user: null, isAuthenticated: false };

        const payload = JSON.parse(
            atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
        );

        // Si el token expiró, limpiar y no restaurar
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('jwt_token');
            return { user: null, isAuthenticated: false };
        }

        return {
            isAuthenticated: true,
            user: {
                id: payload.id,
                email: payload.email,
                role: payload.role as Role,
                reference_id: payload.reference_id ?? null,
            },
        };
    } catch {
        localStorage.removeItem('jwt_token');
        return { user: null, isAuthenticated: false };
    }
}

const initialSession = readSessionFromToken();

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isGlobalLoading: boolean;
    globalLoadingText: string;
    setGlobalLoading: (val: boolean, text?: string) => void;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    rehydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: initialSession.user,
    isAuthenticated: initialSession.isAuthenticated,
    isGlobalLoading: false,
    globalLoadingText: 'Cargando Portal',

    setGlobalLoading: (val, text = 'Cargando Portal') =>
        set({ isGlobalLoading: val, globalLoadingText: text }),

    login: async (email: string, password: string) => {
        const { data } = await apiClient.post('/auth/login', { email, password });
        useOrderDraftStore.getState().clearDraft();
        localStorage.setItem('jwt_token', data.token);
        set({ user: data.user as User, isAuthenticated: true });
    },

    logout: () => {
        useOrderDraftStore.getState().clearDraft();
        localStorage.removeItem('jwt_token');
        set({ user: null, isAuthenticated: false });
    },

    // Mantenemos rehydrate por compatibilidad, pero ya no hace falta llamarlo
    rehydrate: () => {
        const session = readSessionFromToken();
        set(session);
    },
}));
