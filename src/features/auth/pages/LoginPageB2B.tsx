import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Importamos los assets que tenés en tu repo
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

export const LoginPageB2B = () => {
    const login = useAuthStore((state) => state.login);
    const setGlobalLoading = useAuthStore((state) => state.setGlobalLoading);
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [bgIndex, setBgIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % bgImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // ── Login Real contra la API ────────────────────────────────
    const handleRegularLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            setGlobalLoading(true, 'Validando credenciales...');
            await login(email, password);

            // Leer el user recién seteado para redirigir según su rol
            const user = useAuthStore.getState().user;
            if (user) {
                navigate(ROLE_ROUTES[user.role], { replace: true });
            }

            // Dar tiempo al router a renderizar antes de quitar el splash
            setTimeout(() => setGlobalLoading(false), 150);
        } catch (err: any) {
            setGlobalLoading(false);

            // Error de red (servidor no accesible, CORS, timeout)
            if (!err?.response) {
                toast.error('No se pudo conectar con el servidor', {
                    description: 'Verificá tu conexión a internet o contactá al administrador.',
                    duration: 6000,
                });
                return;
            }

            // Error 401 o 403 del backend (credenciales inválidas)
            const status = err.response.status;
            if (status === 401 || status === 403) {
                toast.error('Credenciales incorrectas', {
                    description: 'El correo o la contraseña no son válidos. Intentá nuevamente.',
                    duration: 5000,
                });
                return;
            }

            // Cualquier otro error del backend (500, etc.)
            const backendMessage = err.response?.data?.message
                || err.response?.data?.error
                || 'Ocurrió un error inesperado. Intentá más tarde.';
            toast.error(backendMessage, { duration: 5000 });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-white">

            {/* MITAD IZQUIERDA: Carousel y Branding (Oculto en mobile) */}
            <div className="relative hidden md:flex flex-col justify-between p-12 overflow-hidden bg-zinc-950">

                {/* Logo FIJO en Top-Left del Carrusel */}
                <div className="absolute top-12 left-12 z-20">
                    <img
                        src={LogoTees}
                        alt="Tees Factory"
                        className="h-10 w-auto object-contain filter invert opacity-90"
                    />
                </div>

                {/* Imagen de fondo con overlay oscuro */}
                <div className="absolute inset-0 z-0 bg-zinc-950 overflow-hidden">
                    {bgImages.map((img, idx) => (
                        <img
                            key={idx}
                            src={img}
                            alt={`Tees Factory Background ${idx + 1}`}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === bgIndex ? 'opacity-40' : 'opacity-0'
                                }`}
                        />
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                </div>

                {/* Contenido sobre la imagen */}
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
                    {/* Header del Formulario */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left mb-10">
                        {/* Logo visible solo en mobile y centrado */}
                        <img
                            src={LogoTees}
                            alt="Tees Factory"
                            className="h-12 w-auto object-contain mb-8 md:hidden"
                        />
                        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">
                            Iniciá sesión en tu cuenta
                        </h2>
                        <p className="text-sm text-zinc-500 mt-2 max-w-xs md:max-w-none">
                            Ingresá tu correo electrónico y contraseña para acceder al portal.
                        </p>
                    </div>

                    {/* Formulario Real */}
                    <form onSubmit={handleRegularLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-900 font-semibold">Correo Electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="usuario@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-zinc-900 font-semibold">Contraseña</Label>
                                <button
                                    type="button"
                                    onClick={() => toast.info("Contactá a Administración para blanquear tu acceso.")}
                                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus-visible:ring-zinc-900"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl bg-zinc-900 text-white font-bold text-base hover:bg-zinc-800 transition-all mt-4"
                        >
                            {isLoading ? "Validando credenciales..." : "Iniciar Sesión"}
                        </Button>
                    </form>

                    {/* Footer Contextual */}
                    <p className="text-center text-sm text-zinc-500 mt-10">
                        ¿No tenés una cuenta?{' '}
                        <button
                            onClick={() => toast.info("Portal cerrado. Contactá a tu vendedor para darte de alta.")}
                            className="font-bold text-zinc-900 hover:underline"
                        >
                            Solicitá acceso
                        </button>
                    </p>
                </div>

            </div>
        </div>
    );
}