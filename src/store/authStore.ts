import { create } from 'zustand';

export type Role = 'ADMIN' | 'CLIENT' | 'SELLER';

export interface User {
    id: string;
    name: string;
    role: Role;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isGlobalLoading: boolean;
    setGlobalLoading: (val: boolean) => void;
    login: (role: Role) => void;
    logout: () => void;
}

const mockUsers: Record<Role, User> = {
    ADMIN: { id: 'usr_admin', name: 'Héctor (Admin)', role: 'ADMIN' },
    CLIENT: { id: 'usr_client', name: 'Cliente Mayorista', role: 'CLIENT' },
    SELLER: { id: 'usr_seller', name: 'Vendedor Vantra', role: 'SELLER' },
};

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isGlobalLoading: false,
    setGlobalLoading: (val) => set({ isGlobalLoading: val }),
    login: (role) => {
        const user = mockUsers[role];
        set({ user, isAuthenticated: true });
    },
    logout: () => {
        set({ user: null, isAuthenticated: false });
    },
}));
