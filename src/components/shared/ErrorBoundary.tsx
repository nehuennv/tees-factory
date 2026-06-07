import { Component, type ErrorInfo, type ReactNode } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    error: Error | null;
}

/**
 * Atrapa errores de render de React (que normalmente dejan la pantalla en
 * blanco) y muestra una pantalla clara + un toast rojo. Un crash de render es
 * un bug del frontend, así que indica "Contactá a Frontend".
 */
export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('[frontend] Error de render:', error, info);
        toast.error('Algo salió mal', {
            description: `${error.message}\nContactá a Frontend.`,
            duration: 10000,
        });
    }

    handleReload = () => window.location.reload();

    render() {
        const { error } = this.state;
        if (!error) return this.props.children;

        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 p-6">
                <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl shadow-sm p-8 flex flex-col items-center text-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                        <AlertTriangle className="w-7 h-7 text-rose-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h1 className="text-lg font-bold text-zinc-900">Algo salió mal</h1>
                        <p className="text-sm text-zinc-500">
                            Ocurrió un error en la aplicación. Probá recargar; si sigue pasando,
                            <span className="font-semibold text-zinc-700"> contactá a Frontend</span> con el detalle de abajo.
                        </p>
                    </div>
                    <pre className="w-full text-left text-xs bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-rose-600 overflow-auto max-h-40 whitespace-pre-wrap break-words">
                        {error.message || 'Error desconocido'}
                    </pre>
                    <Button
                        onClick={this.handleReload}
                        className="rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Recargar página
                    </Button>
                </div>
            </div>
        );
    }
}
