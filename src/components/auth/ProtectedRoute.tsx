import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/store/authStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated || !user) {
        // Redirect to login but save the attempted url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        // Role not allowed, redirect to their default home
        const defaultRoutes: Record<Role, string> = {
            ADMIN: '/admin',
            CLIENT: '/portal',
            SELLER: '/ventas/clientes',
        };
        return <Navigate to={defaultRoutes[user.role]} replace />;
    }

    return <>{children}</>;
}
