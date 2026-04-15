import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { ClientList } from '@/components/shared/ClientList';

export const ClientsPage: React.FC = () => {
    const { user } = useAuthStore();

    if (!user) return null;

    return (
        <div className="h-full w-full overflow-y-auto bg-zinc-50 p-6">
            <div className="w-full mx-auto pb-20">
                <ClientList />
            </div>
        </div>
    );
};

export default ClientsPage;
