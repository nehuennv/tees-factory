import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { ClientList } from '@/components/shared/ClientList';

export const ClientsPage: React.FC = () => {
    const { user } = useAuthStore();

    if (!user) return null;

    // Asignamos el rol según si es ADMIN o SELLER.
    // El componente ClientList espera 'ADMIN' | 'SELLER'.
    const role = user.role === 'ADMIN' ? 'ADMIN' : 'SELLER';

    return (
        <div className="w-full h-full flex flex-col p-2">
            <ClientList role={role} />
        </div>
    );
};

export default ClientsPage;
