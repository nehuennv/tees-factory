import { create } from 'zustand';
import apiClient from '@/lib/apiClient';

export type Role = 'ADMIN' | 'CLIENT' | 'SELLER';

export interface User {
    id: string;
    email: string;
    role: Role;
    /** UUID del perfil asociado (CLIENTS o SELLERS). null para ADMIN. */
    reference_id: string | null;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isGlobalLoading: boolean;
    globalLoadingText: string;
    setGlobalLoading: (val: boolean, text?: string) => void;

    /**
     * Login real contra POST /api/auth/login.
     * Guarda el JWT en localStorage y el user en estado global.
     */
    login: (email: string, password: string) => Promise<void>;

    /** Limpia sesión, token y redirige a login */
    logout: () => void;

    /** Intenta rehidratar la sesión desde un JWT guardado en localStorage */
    rehydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isGlobalLoading: false,
    globalLoadingText: 'Cargando Portal',

    setGlobalLoading: (val, text = 'Cargando Portal') =>
        set({ isGlobalLoading: val, globalLoadingText: text }),

    // ── Login Real ──────────────────────────────────────────────
    login: async (email: string, password: string) => {
        const { data } = await apiClient.post('/auth/login', { email, password });

        // Persistir token para que el interceptor de Axios lo adjunte
        localStorage.setItem('jwt_token', data.token);

        set({
            user: data.user as User,
            isAuthenticated: true,
        });
    },

    // ── Logout ──────────────────────────────────────────────────
    logout: () => {
        localStorage.removeItem('jwt_token');
        set({ user: null, isAuthenticated: false });
    },

    // ── Rehidratar sesión ───────────────────────────────────────
    // Si el usuario recarga la página y hay un token en localStorage,
    // intentamos validarlo. Por ahora solo rehidratamos desde localStorage.
    // Cuando el backend tenga GET /api/auth/me, se puede mejorar.
    rehydrate: () => {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        // Para tokens reales: por ahora lo dejamos como "logueado" (ya que hay un token).
        // Si el backend es de verdad, se podría pedir GET /api/auth/me aquí.
        set({ isAuthenticated: true });
        // pero sin user data (el interceptor 401 limpiará si está expirado).
        // Idealmente se pide GET /api/auth/me aquí.
    },
}));
