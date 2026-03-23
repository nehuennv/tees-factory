import { useNavigate } from 'react-router-dom';
import { Package, ShieldAlert, Store, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/store/authStore';

const ROLE_ROUTES: Record<Role, string> = {
    ADMIN: '/admin',
    CLIENT: '/portal',
    SELLER: '/ventas/clientes',
};

export default function LoginPage() {
    const login = useAuthStore((state) => state.login);
    const setGlobalLoading = useAuthStore((state) => state.setGlobalLoading);
    const navigate = useNavigate();

    const handleLogin = async (role: Role) => {
        try {
            // Empieza a cargar (monta SplashScreen a nivel global desde App)
            setGlobalLoading(true);

            // Simulación de red
            await new Promise((resolve) => setTimeout(resolve, 1400));

            // Auth real
            login(role);

            // Navegamos por detrás. El SplashScreen global tapa todo el salto arquitectónico.
            navigate(ROLE_ROUTES[role], { replace: true });

            // Apagamos la bandera del loader. El componente global empezará su "Fade Out"
            // revelando elegantemente el nuevo dashboard que ya se pintó por detrás.
            setGlobalLoading(false);
        } catch (error) {
            console.error(error);
            setGlobalLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[24px] shadow-sm border border-zinc-200 p-8">

                {/* Header */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-md mb-6">
                        <Package className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 mb-2">Vantra B2B</h1>
                    <p className="text-zinc-500 text-sm">Portal Privado de Autogestión Mayorista</p>
                </div>

                {/* Login Buttons */}
                <div className="space-y-4">
                    <button
                        onClick={() => handleLogin('ADMIN')}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-zinc-900">Entrar como Admin</p>
                                <p className="text-xs text-zinc-500">Acceso total (Dueño)</p>
                            </div>
                        </div>
                        <div className="text-zinc-400 group-hover:text-zinc-900 transition-colors">
                            &rarr;
                        </div>
                    </button>

                    <button
                        onClick={() => handleLogin('CLIENT')}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <Store className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-zinc-900">Entrar como Cliente</p>
                                <p className="text-xs text-zinc-500">Comprar y pagar deuda</p>
                            </div>
                        </div>
                        <div className="text-zinc-400 group-hover:text-zinc-900 transition-colors">
                            &rarr;
                        </div>
                    </button>

                    <button
                        onClick={() => handleLogin('SELLER')}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-zinc-900">Entrar como Vendedor</p>
                                <p className="text-xs text-zinc-500">Cartera y toma de pedidos</p>
                            </div>
                        </div>
                        <div className="text-zinc-400 group-hover:text-zinc-900 transition-colors">
                            &rarr;
                        </div>
                    </button>
                </div>

                <div className="mt-8 text-center bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg border border-yellow-200">
                    <strong>Modo de Prueba:</strong> Al hacer clic en cualquiera de los botones, ingresarás simulando ese rol de manera local.
                </div>

            </div>
        </div>
    );
}
