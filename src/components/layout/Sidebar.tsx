import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutGrid, Database, Users, LogOut, Wallet, Receipt,
    ClipboardCheck, ShoppingBag, ClipboardList, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logoUrl from '@/assets/logo/LogoTeesFactorynegro.png';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/store/authStore';
import { Modal } from '@/components/shared/Modal';

// ─── Config ────────────────────────────────────────────────────────────────────

type NavItemConfig = {
    to: string;
    icon: React.ElementType;
    label: string;
    aliases?: string[];
    allowedRoles: Role[];
};

const NAV_ITEMS: NavItemConfig[] = [
    { to: '/admin',            icon: LayoutGrid,    label: 'Dashboard',       allowedRoles: ['ADMIN'] },
    { to: '/admin/logistica',  icon: ClipboardCheck,label: 'Pedidos',         allowedRoles: ['ADMIN'] },
    { to: '/admin/tesoreria',  icon: Wallet,        label: 'Tesorería',       allowedRoles: ['ADMIN'] },
    { to: '/admin/clientes',   icon: Users,         label: 'Clientes',        allowedRoles: ['ADMIN'] },
    { to: '/admin/inventario', icon: Database,      label: 'Inventario',      aliases: ['/admin/inventario'], allowedRoles: ['ADMIN'] },
    { to: '/portal',           icon: LayoutGrid,    label: 'Resumen / Deuda', allowedRoles: ['CLIENT'] },
    { to: '/portal/catalogo',  icon: ShoppingBag,   label: 'Catálogo',        allowedRoles: ['CLIENT'] },
    { to: '/portal/pedidos',   icon: ClipboardList, label: 'Mis Pedidos',     allowedRoles: ['CLIENT'] },
    { to: '/portal/pagos',     icon: Receipt,       label: 'Reportar Pago',   allowedRoles: ['CLIENT'] },
    { to: '/ventas/clientes',  icon: Users,         label: 'Mis Clientes',    allowedRoles: ['SELLER'] },
    { to: '/ventas/logistica', icon: ClipboardCheck,label: 'Pedidos',         allowedRoles: ['SELLER'] },
];

const STORAGE_KEY = 'sidebar-collapsed';

// ─── Spacing system ─────────────────────────────────────────────────────────
// Sidebar collapsed: 72px  |  expanded: 240px
// All items use mx-2 (8px gutter from sidebar edges).
// Within item: paddingLeft/Right animates between:
//   collapsed  → 19px  (centers 18px icon in 56px available: (72-16-18)/2 = 19)
//   expanded   → 10px  (icon sits at 8+10 = 18px from sidebar edge)
// Header logo also starts at 18px: mx-2 (8) + px-[10px] (10) = 18px. ✓
// All three sections share the same left-edge alignment.

const DUR  = 260; // ms
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

// For any element that fades in/out horizontally with the sidebar
const fadeTransition = (dur = DUR) =>
    `max-width ${dur}ms ${EASE}, opacity ${Math.round(dur * 0.8)}ms ease, margin-left ${dur}ms ${EASE}`;

const paddingTransition = (dur = DUR) =>
    `padding-left ${dur}ms ${EASE}, padding-right ${dur}ms ${EASE}, background-color 100ms ease-out, color 100ms ease-out`;

// ─── Sidebar ────────────────────────────────────────────────────────────────

export default function Sidebar() {
    const { user, logout, setGlobalLoading } = useAuthStore();
    const navigate = useNavigate();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
    });

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, String(collapsed)); } catch {}
    }, [collapsed]);

    const handleLogoutConfirm = async () => {
        setIsLogoutModalOpen(false);
        setGlobalLoading(true, 'Cerrando Sesión...');
        await new Promise((r) => setTimeout(r, 600));
        logout();
        navigate('/login', { replace: true });
        setTimeout(() => setGlobalLoading(false), 150);
    };

    const filteredNavItems = user
        ? NAV_ITEMS.filter((item) => item.allowedRoles.includes(user.role))
        : [];

    const username  = user?.email?.split('@')[0] ?? 'Usuario';
    const roleLabel = user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'SELLER' ? 'Vendedor' : 'Cliente';

    // Shared style for every row-level element (header, nav items, bottom items)
    const rowPadding: React.CSSProperties = {
        paddingLeft:  collapsed ? 19 : 10,
        paddingRight: collapsed ? 19 : 10,
        transition: paddingTransition(),
    };

    // Shared style for text that fades in/out
    const textFade = (maxW = 160): React.CSSProperties => ({
        maxWidth:   collapsed ? 0 : maxW,
        opacity:    collapsed ? 0 : 1,
        marginLeft: collapsed ? 0 : 10,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        transition: fadeTransition(),
    });

    return (
        <>
            <aside
                style={{ width: collapsed ? 72 : 240, transition: `width ${DUR}ms ${EASE}` }}
                className="h-full bg-white border border-zinc-200/60 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col py-5 flex-shrink-0 z-20 overflow-hidden"
            >

                {/* ── Header ──────────────────────────────────────── */}
                <div
                    className="mx-2 flex items-center rounded-xl mb-5"
                    style={{ ...rowPadding, paddingTop: 8, paddingBottom: 8 }}
                >
                    <div className="w-[34px] h-[34px] bg-[#181516] rounded-[10px] flex items-center justify-center flex-shrink-0 p-[7px]">
                        <img src={logoUrl} alt="Tees Factory" className="w-full h-full object-contain" />
                    </div>
                    <span
                        className="text-[13.5px] font-bold text-zinc-900 leading-none"
                        style={textFade(130)}
                    >
                        Tees Factory
                    </span>
                </div>

                {/* ── Divider ─────────────────────────────────────── */}
                <div className="mx-3 mb-3 h-px bg-zinc-100" />

                {/* ── Nav ─────────────────────────────────────────── */}
                <nav className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">

                    {/* Section label */}
                    <span
                        className="block mx-2 overflow-hidden whitespace-nowrap text-[10px] font-semibold uppercase tracking-widest text-zinc-400 select-none"
                        style={{
                            paddingLeft: 10,
                            maxHeight: collapsed ? 0 : 18,
                            opacity:    collapsed ? 0 : 1,
                            marginBottom: collapsed ? 0 : 6,
                            transition: `max-height ${DUR}ms ${EASE}, opacity ${Math.round(DUR * 0.8)}ms ease, margin-bottom ${DUR}ms ${EASE}`,
                        }}
                    >
                        Menú
                    </span>

                    <div className="flex flex-col gap-0.5">
                        {filteredNavItems.map((item) => (
                            <NavItem key={item.to} {...item} collapsed={collapsed} />
                        ))}
                    </div>
                </nav>

                {/* ── Divider ─────────────────────────────────────── */}
                <div className="mx-3 mt-3 mb-3 h-px bg-zinc-100" />

                {/* ── Bottom ──────────────────────────────────────── */}
                <div className="flex flex-col gap-0.5">

                    {/* User */}
                    <div
                        className="mx-2 flex items-center rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors duration-150"
                        style={{ ...rowPadding, paddingTop: 8, paddingBottom: 8 }}
                    >
                        <div className="relative flex-shrink-0">
                            <img
                                src={`https://ui-avatars.com/api/?name=${username}&background=f4f4f5&color=18181b&bold=true`}
                                alt="Perfil"
                                className="w-[34px] h-[34px] rounded-full object-cover border border-zinc-200 flex-shrink-0"
                            />
                            <span className="absolute bottom-0 right-0 w-[9px] h-[9px] rounded-full bg-emerald-400 border-2 border-white" />
                        </div>
                        <div style={textFade(140)} className="min-w-0">
                            <p className="text-[12px] font-semibold text-zinc-800 truncate leading-snug">{username}</p>
                            <p className="text-[10.5px] text-zinc-400 truncate leading-snug">{roleLabel}</p>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="mx-2 flex items-center rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-50/70 transition-colors duration-150 outline-none"
                        style={{ ...rowPadding, paddingTop: 9, paddingBottom: 9 }}
                        aria-label="Cerrar Sesión"
                    >
                        <LogOut size={17} className="flex-shrink-0" strokeWidth={1.8} />
                        <span className="text-[12.5px] font-medium" style={textFade()}>
                            Cerrar Sesión
                        </span>
                    </button>

                    {/* Toggle */}
                    <button
                        onClick={() => setCollapsed((c) => !c)}
                        className="mx-2 flex items-center rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors duration-150 outline-none"
                        style={{ ...rowPadding, paddingTop: 9, paddingBottom: 9 }}
                        aria-label={collapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
                    >
                        <ChevronRight
                            size={15}
                            strokeWidth={2.5}
                            className="flex-shrink-0"
                            style={{
                                transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                                transition: `transform ${DUR}ms ${EASE}`,
                            }}
                        />
                        <span className="text-[12.5px] font-medium" style={textFade()}>
                            Contraer
                        </span>
                    </button>

                </div>
            </aside>

            <Modal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                title="Cerrar Sesión"
                description="¿Estás seguro de que deseas salir de tu cuenta? Tendrás que volver a ingresar tus credenciales."
                maxWidth="sm"
                hideCloseButton
                primaryAction={{ label: 'Sí, cerrar sesión', variant: 'destructive', onClick: handleLogoutConfirm }}
                secondaryAction={{ label: 'Cancelar', onClick: () => setIsLogoutModalOpen(false) }}
            />
        </>
    );
}

// ─── NavItem ────────────────────────────────────────────────────────────────

interface NavItemProps {
    to: string;
    icon: React.ElementType;
    label: string;
    aliases?: string[];
    collapsed: boolean;
}

function NavItem({ to, icon: Icon, label, aliases, collapsed }: NavItemProps) {
    const location = useLocation();
    const isActive =
        location.pathname === to ||
        (aliases?.some((a) => location.pathname.startsWith(a)) ?? false);

    return (
        <div className="relative group/nav mx-2">
            <NavLink
                to={to}
                aria-label={label}
                style={{
                    paddingLeft:  collapsed ? 19 : 10,
                    paddingRight: collapsed ? 19 : 10,
                    paddingTop: 9,
                    paddingBottom: 9,
                    transition: paddingTransition(),
                }}
                className={cn(
                    'flex items-center w-full rounded-xl outline-none select-none',
                    isActive
                        ? 'bg-zinc-900 text-white'
                        : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/80'
                )}
            >
                <Icon
                    size={18}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className="flex-shrink-0"
                />
                <span
                    className="text-[13px] font-medium leading-none overflow-hidden whitespace-nowrap"
                    style={{
                        maxWidth:   collapsed ? 0 : 170,
                        opacity:    collapsed ? 0 : 1,
                        marginLeft: collapsed ? 0 : 10,
                        transition: fadeTransition(),
                    }}
                >
                    {label}
                </span>
            </NavLink>

            {/* Tooltip — solo en colapsado */}
            {collapsed && (
                <div className={cn(
                    'absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50',
                    'px-3 py-1.5 bg-zinc-900 text-white text-[11.5px] font-medium rounded-lg shadow-lg whitespace-nowrap',
                    'pointer-events-none opacity-0 -translate-x-1',
                    'transition-[opacity,transform] duration-150 ease-out',
                    'group-hover/nav:opacity-100 group-hover/nav:translate-x-0',
                )}>
                    {label}
                </div>
            )}
        </div>
    );
}
