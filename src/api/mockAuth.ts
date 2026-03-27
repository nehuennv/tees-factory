import type { Role } from '@/store/authStore';

export interface AuthResponse {
    id: string;
    name: string;
    email: string;
    token: string;
    role: Role;
}

export const mockLoginApi = async (credentials: { email: string; password?: string }): Promise<AuthResponse> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const { email } = credentials;
            if (email === 'admin@tees.com') {
                resolve({
                    id: 'usr_admin',
                    name: 'Héctor',
                    email,
                    token: 'mock-token-admin-123',
                    role: 'ADMIN',
                });
            } else if (email === 'client@tees.com') {
                resolve({
                    id: 'usr_client',
                    name: 'Cliente Mayorista',
                    email,
                    token: 'mock-token-client-456',
                    role: 'CLIENT',
                });
            } else if (email === 'seller@tees.com') {
                resolve({
                    id: 'usr_seller',
                    name: 'Vendedor',
                    email,
                    token: 'mock-token-seller-789',
                    role: 'SELLER',
                });
            } else {
                reject(new Error('Credenciales inválidas'));
            }
        }, 1500);
    });
};
