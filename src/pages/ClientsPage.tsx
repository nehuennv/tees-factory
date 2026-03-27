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
        <div className="h-full w-full overflow-y-auto bg-zinc-50 p-6">
            <div className="w-full mx-auto pb-20">
                <ClientList role={role} currentUserId={user.id} />
            </div>
        </div>
    );
};

export default ClientsPage;
