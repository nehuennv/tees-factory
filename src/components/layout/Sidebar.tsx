import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Package, LayoutGrid, Database, Users, LogOut, Wallet, Receipt, Boxes, ShoppingBag, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/store/authStore';
import { Modal } from '@/components/shared/Modal';

// 1. Configuración Centralizada de items
type NavItemConfig = {
    to: string;
    icon: React.ElementType;
    label: string;
    aliases?: string[];
    allowedRoles: Role[];
};

const NAV_ITEMS: NavItemConfig[] = [
    // ADMIN
    { to: '/admin', icon: LayoutGrid, label: 'Dashboard', allowedRoles: ['ADMIN'] },
    { to: '/admin/logistica', icon: Boxes, label: 'Tablero de Preparación', allowedRoles: ['ADMIN'] },
    { to: '/admin/tesoreria', icon: Wallet, label: 'Tesorería', allowedRoles: ['ADMIN'] },
    { to: '/admin/clientes', icon: Users, label: 'Clientes', allowedRoles: ['ADMIN'] },
    { to: '/admin/inventario', icon: Database, label: 'Inventario/Catálogo', aliases: ['/admin/inventario'], allowedRoles: ['ADMIN'] },

    // CLIENT
    { to: '/portal', icon: LayoutGrid, label: 'Resumen/Deuda', allowedRoles: ['CLIENT'] },
    { to: '/portal/catalogo', icon: ShoppingBag, label: 'Catálogo', allowedRoles: ['CLIENT'] },
    { to: '/portal/pedidos', icon: ClipboardList, label: 'Historial de Pedidos', allowedRoles: ['CLIENT'] },
    { to: '/portal/pagos', icon: Receipt, label: 'Reportar Pago', allowedRoles: ['CLIENT'] },

    // SELLER
    { to: '/ventas/clientes', icon: Users, label: 'Mi Cartera de Clientes', allowedRoles: ['SELLER'] },
    // Eliminamos el tomar pedido con ID explícito de la sidebar, o lo dejamos como vista general
    { to: '/ventas/catalogo', icon: ShoppingBag, label: 'Catálogo Vendedores', allowedRoles: ['SELLER'] },
];

export default function Sidebar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleLogoutConfirm = () => {
        setIsLogoutModalOpen(false);
        logout();
        navigate('/login');
    };

    // Filter items based on the current user's role
    const filteredNavItems = user ? NAV_ITEMS.filter(item => item.allowedRoles.includes(user.role)) : [];

    return (
        <aside className="w-20 lg:w-24 h-full bg-white border border-zinc-200/60 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center py-6 justify-between flex-shrink-0 z-20">
            <div className="flex flex-col items-center gap-8 w-full">
                {/* App Logo */}
                <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-md cursor-pointer hover:bg-zinc-800 transition-all duration-300 hover:scale-105 active:scale-95">
                    <Package className="w-6 h-6" />
                </div>

                {/* Navigation Icons */}
                <nav className="flex flex-col gap-2 w-full items-center px-4">
                    {filteredNavItems.map((item) => (
                        <NavItem key={item.to} {...item} />
                    ))}
                </nav>
            </div>

            {/* Bottom Section (User & Logout) */}
            <div className="flex flex-col items-center gap-4">
                {user && (
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="w-10 h-10 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors group relative"
                    >
                        <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-900 text-white text-xs font-semibold tracking-wide rounded-md opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap shadow-xl">
                            Cerrar Sesión
                            <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2.5 h-2.5 bg-zinc-900 rotate-45 rounded-[2px] z-[-1]"></div>
                        </div>
                    </button>
                )}

                {/* User Avatar */}
                <div className="relative group w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center overflow-visible border border-zinc-200 cursor-pointer hover:ring-2 hover:ring-zinc-900 hover:ring-offset-2 transition-all duration-300 hover:scale-105">
                    <img
                        src={`https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=f4f4f5&color=18181b&bold=true`}
                        alt="Perfil del Usuario"
                        className="w-full h-full object-cover rounded-full"
                    />
                    {/* Tooltip for user name */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-900 text-white text-xs font-semibold tracking-wide rounded-md opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap shadow-xl">
                        {user?.name || 'Usuario'}
                        <div className="block absolute top-1/2 -translate-y-1/2 -left-1 w-2.5 h-2.5 bg-zinc-900 rotate-45 rounded-[2px] z-[-1]"></div>
                    </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            <Modal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                title="Cerrar Sesión"
                description="¿Estás seguro de que deseas salir de tu cuenta? Tendrás que volver a ingresar tus credenciales."
                maxWidth="sm"
                hideCloseButton
                primaryAction={{
                    label: 'Sí, cerrar sesión',
                    variant: 'destructive',
                    onClick: handleLogoutConfirm,
                }}
                secondaryAction={{
                    label: 'Cancelar',
                    onClick: () => setIsLogoutModalOpen(false),
                }}
            />
        </aside>
    );
}

// 2. Componente de Ítem Aislado
interface NavItemProps {
    to: string;
    icon: React.ElementType;
    label: string;
    aliases?: string[];
}

function NavItem({ to, icon: Icon, label, aliases }: NavItemProps) {
    const location = useLocation();
    const isActive = location.pathname === to || (aliases && aliases.some(alias => location.pathname.startsWith(alias)));

    return (
        <div className="relative group w-full flex justify-center">
            <NavLink
                to={to}
                aria-label={label}
                className={cn(
                    "relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 outline-none",
                    isActive
                        ? "bg-zinc-100 text-zinc-900 border border-zinc-200/80 shadow-sm"
                        : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 border border-transparent"
                )}
            >
                <div className={cn(
                    "transition-transform duration-300",
                    isActive ? "scale-100" : "group-hover:scale-110"
                )}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
            </NavLink>

            {/* Tooltip Optimizado */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-900 text-white text-xs font-semibold tracking-wide rounded-md opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out z-50 whitespace-nowrap shadow-xl">
                {label}
                <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2.5 h-2.5 bg-zinc-900 rotate-45 rounded-[2px] z-[-1]"></div>
            </div>
        </div>
    );
}