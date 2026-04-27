import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, X, Mail, KeyRound } from 'lucide-react';

import LogoTees from '@/assets/logo/LogoTeesFactorynegro.png';
import Bg1 from '@/assets/login/1.webp';
import Bg2 from '@/assets/login/2.webp';
import Bg3 from '@/assets/login/3.webp';

const bgImages = [Bg1, Bg2, Bg3];

const ROLE_ROUTES: Record<Role, string> = {
    ADMIN: '/admin',
    CLIENT: '/portal',
    SELLER: '/ventas/clientes',
};

// 1. Convertimos el modal en un componente genérico y reutilizable
interface ContactSupportModalProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    footerText?: string;
    onClose: () => void;
}

function ContactSupportModal({ title, description, icon, footerText, onClose }: ContactSupportModalProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header con gradiente */}
                <div className="bg-zinc-900 px-8 pt-8 pb-10">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                        {icon}
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight">
                        {title}
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1 leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Contenido (Contactos estáticos para ambos casos) */}
                <div className="px-8 py-7 flex flex-col gap-4">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                        Contacto de desarrolladores
                    </p>

                    {/* Contacto 1 */}
                    <a
                        href="mailto:pedroreverendo04@gmail.com"
                        className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-200 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Mail className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs text-zinc-400 font-medium">Pedro</span>
                            <span className="text-sm font-bold text-zinc-900 truncate">
                                pedroreverendo04@gmail.com
                            </span>
                        </div>
                    </a>

                    {/* Contacto 2 */}
                    <a
                        href="mailto:villavicencionehuen@gmail.com"
                        className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-200 transition-all group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Mail className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs text-zinc-400 font-medium">Nehuen</span>
                            <span className="text-sm font-bold text-zinc-900 truncate">
                                villavicencionehuen@gmail.com
                            </span>
                        </div>
                    </a>

                    {footerText && (
                        <p className="text-xs text-zinc-400 text-center leading-relaxed pt-1">
                            {footerText}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export const LoginPageB2B = () => {
    const login = useAuthStore((state) => state.login);
    const setGlobalLoading = useAuthStore((state) => state.setGlobalLoading);
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [bgIndex, setBgIndex] = useState(0);

    // 2. Unificamos el estado para manejar qué modal mostrar
    const [modalType, setModalType] = useState<'none' | 'access' | 'password'>('none');

    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % bgImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleRegularLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            setGlobalLoading(true, 'Validando credenciales...');
            await login(email, password);

            const user = useAuthStore.getState().user;
            if (user) {
                navigate(ROLE_ROUTES[user.role], { replace: true });
            }

            setTimeout(() => setGlobalLoading(false), 150);
        } catch (err: any) {
            setGlobalLoading(false);

            if (!err?.response) {
                toast.error('No se pudo conectar con el servidor', {
                    description: 'Verificá tu conexión a internet o contactá al administrador.',
                    duration: 6000,
                });
                return;
            }

            const status = err.response.status;
            if (status === 401 || status === 403) {
                toast.error('Credenciales incorrectas', {
                    description: 'El correo o la contraseña no son válidos. Intentá nuevamente.',
                    duration: 5000,
                });
                return;
            }

            const backendMessage = err.response?.data?.message
                || err.response?.data?.error
                || 'Ocurrió un error inesperado. Intentá más tarde.';
            toast.error(backendMessage, { duration: 5000 });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-white">

                {/* MITAD IZQUIERDA: Carousel y Branding */}
                <div className="relative hidden md:flex flex-col justify-between p-12 overflow-hidden bg-zinc-950">
                    <div className="absolute top-12 left-12 z-20">
                        <img
                            src={LogoTees}
                            alt="Tees Factory"
                            className="h-10 w-auto object-contain filter invert opacity-90"
                        />
                    </div>

                    <div className="absolute inset-0 z-0 bg-zinc-950 overflow-hidden">
                        {bgImages.map((img, idx) => (
                            <img
                                key={idx}
                                src={img}
                                alt={`Tees Factory Background ${idx + 1}`}
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === bgIndex ? 'opacity-40' : 'opacity-0'}`}
                            />
                        ))}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                    </div>

                    <div className="relative z-10 flex flex-col justify-end h-full max-w-lg mb-8">
                        <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4 drop-shadow-md">
                            La base para tus mejores colecciones.
                        </h1>
                        <p className="text-zinc-400 text-lg font-medium drop-shadow-md max-w-md">
                            Plataforma de autogestión exclusiva para clientes mayoristas y fuerza de ventas.
                        </p>
                    </div>
                </div>

                {/* MITAD DERECHA: Formulario de Login */}
                <div className="relative flex flex-col justify-center min-h-screen px-6 sm:px-12 md:px-16 lg:px-24 xl:px-32 bg-white">
                    <div className="w-full max-w-[380px] mx-auto flex flex-col justify-center">

                        <div className="flex flex-col items-center md:items-start text-center md:text-left mb-10">
                            <img
                                src={LogoTees}
                                alt="Tees Factory"
                                className="h-12 w-auto object-contain mb-8 md:hidden"
                            />
                            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">
                                Iniciá sesión
                            </h2>
                            <p className="text-sm text-zinc-500 mt-2 max-w-xs md:max-w-none">
                                Ingresá tus credenciales para acceder al portal B2B.
                            </p>
                        </div>

                        <form onSubmit={handleRegularLogin} className="space-y-5">
                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-700 font-semibold text-sm">
                                    Correo Electrónico
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="usuario@empresa.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900 placeholder:text-zinc-300"
                                    required
                                />
                            </div>

                            {/* Contraseña */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-zinc-700 font-semibold text-sm">
                                        Contraseña
                                    </Label>
                                    <button
                                        type="button"
                                        // 3. Abrimos el modal de contraseña en vez del toast
                                        onClick={() => setModalType('password')}
                                        className="text-xs font-semibold text-zinc-400 hover:text-zinc-900 transition-colors"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900 pr-12 placeholder:text-zinc-300"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl bg-zinc-900 text-white font-bold text-base hover:bg-zinc-800 transition-all mt-2"
                            >
                                {isLoading ? 'Validando credenciales...' : 'Iniciar Sesión'}
                            </Button>
                        </form>

                        <p className="text-center text-sm text-zinc-500 mt-10">
                            ¿No tenés una cuenta?{' '}
                            <button
                                // 4. Abrimos el modal de acceso
                                onClick={() => setModalType('access')}
                                className="font-bold text-zinc-900 hover:underline underline-offset-2"
                            >
                                Solicitá acceso
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {/* 5. Renderizado condicional de los modales reutilizando el mismo componente */}
            {modalType === 'access' && (
                <ContactSupportModal
                    title="Solicitar acceso al portal"
                    description="Comunicate con nuestro equipo para que te demos de alta como cliente."
                    icon={<Mail className="w-6 h-6 text-white" />}
                    footerText="Mencioná el nombre de tu empresa y te configuramos el acceso a la brevedad."
                    onClose={() => setModalType('none')}
                />
            )}

            {modalType === 'password' && (
                <ContactSupportModal
                    title="Restablecer contraseña"
                    description="Comunicate con el equipo de desarrollo para blanquear tus credenciales de acceso de forma segura."
                    icon={<KeyRound className="w-6 h-6 text-white" />}
                    footerText="Por seguridad, el blanqueo de contraseñas se realiza de forma manual."
                    onClose={() => setModalType('none')}
                />
            )}
        </>
    );
}