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

    /**
     * Debug login — mantiene los botones de desarrollo para acceso rápido.
     * Solo disponible en entorno DEV. Llama al mismo endpoint real con
     * credenciales pre-configuradas, o setea un mock local si el server no responde.
     */
    debugLogin: (role: Role) => void;

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

    // ── Debug Login (solo DEV) ──────────────────────────────────
    debugLogin: (role: Role) => {
        // Fallback local para desarrollo sin servidor backend activo
        const mockUsers: Record<Role, User> = {
            ADMIN:  { id: 'dev_admin',  email: 'admin@hector.com',   role: 'ADMIN',  reference_id: null },
            CLIENT: { id: 'dev_client', email: 'cliente@tienda.com', role: 'CLIENT', reference_id: 'dev-client-profile' },
            SELLER: { id: 'dev_seller', email: 'vendedor@hector.com', role: 'SELLER', reference_id: 'dev-seller-profile' },
        };

        const user = mockUsers[role];
        localStorage.setItem('jwt_token', `dev_token_${role}`);
        set({ user, isAuthenticated: true });
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

        // Si es un token de debug, rehidratar con el mock local
        if (token.startsWith('dev_token_')) {
            const role = token.replace('dev_token_', '') as Role;
            const mockUsers: Record<Role, User> = {
                ADMIN:  { id: 'dev_admin',  email: 'admin@hector.com',   role: 'ADMIN',  reference_id: null },
                CLIENT: { id: 'dev_client', email: 'cliente@tienda.com', role: 'CLIENT', reference_id: 'dev-client-profile' },
                SELLER: { id: 'dev_seller', email: 'vendedor@hector.com', role: 'SELLER', reference_id: 'dev-seller-profile' },
            };
            if (mockUsers[role]) {
                set({ user: mockUsers[role], isAuthenticated: true });
            }
            return;
        }

        // Para tokens reales: por ahora lo dejamos como "logueado"
        // pero sin user data (el interceptor 401 limpiará si está expirado).
        // Idealmente se pide GET /api/auth/me aquí.
    },
}));
