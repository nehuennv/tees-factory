import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HoldToConfirmButtonProps {
    /** Se dispara cuando el hold se completa (o por teclado con Enter/Espacio). */
    onConfirm: () => void;
    label: string;
    /** Texto mientras se mantiene presionado. */
    holdingLabel?: string;
    /** Texto mientras procesa (post-confirm). */
    loadingLabel?: string;
    holdDuration?: number;
    disabled?: boolean;
    isLoading?: boolean;
    className?: string;
}

/**
 * Botón "mantener para confirmar": evita confirmaciones accidentales y dobles
 * envíos en acciones sensibles (ej. cargar deuda). El usuario debe sostener la
 * pulsación holdDuration ms; al soltar antes se cancela. Accesible por teclado
 * (Enter/Espacio confirman directamente, ya que tabular hasta él es intencional).
 */
export function HoldToConfirmButton({
    onConfirm,
    label,
    holdingLabel = 'Mantené para confirmar…',
    loadingLabel = 'Procesando…',
    holdDuration = 1500,
    disabled = false,
    isLoading = false,
    className,
}: HoldToConfirmButtonProps) {
    const [progress, setProgress] = useState(0);
    const [holding, setHolding] = useState(false);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef<number>(0);
    const firedRef = useRef(false);

    const stop = useCallback(() => {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        setHolding(false);
        setProgress(0);
    }, []);

    const tick = useCallback(() => {
        const elapsed = performance.now() - startRef.current;
        const p = Math.min(1, elapsed / holdDuration);
        setProgress(p);
        if (p >= 1) {
            if (!firedRef.current) {
                firedRef.current = true;
                stop();
                onConfirm();
            }
            return;
        }
        rafRef.current = requestAnimationFrame(tick);
    }, [holdDuration, onConfirm, stop]);

    const start = useCallback(() => {
        if (disabled || isLoading || firedRef.current) return;
        setHolding(true);
        startRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
    }, [disabled, isLoading, tick]);

    // reset fired flag cuando deja de cargar (permite reusar)
    useEffect(() => {
        if (!isLoading) firedRef.current = false;
    }, [isLoading]);

    useEffect(() => () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); }, []);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isLoading && !firedRef.current) {
            e.preventDefault();
            firedRef.current = true;
            onConfirm();
        }
    };

    return (
        <button
            type="button"
            disabled={disabled || isLoading}
            onPointerDown={start}
            onPointerUp={stop}
            onPointerLeave={stop}
            onPointerCancel={stop}
            onKeyDown={onKeyDown}
            aria-label={label}
            className={cn(
                'relative overflow-hidden select-none touch-none rounded-xl h-11 px-5 font-bold text-white',
                'bg-zinc-900 hover:bg-zinc-800 transition-colors shadow-sm',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/30',
                className
            )}
        >
            {/* Relleno de progreso */}
            <span
                className="absolute inset-y-0 left-0 bg-rose-600/80 pointer-events-none transition-[width] duration-75"
                style={{ width: `${progress * 100}%` }}
                aria-hidden="true"
            />
            <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {loadingLabel}
                    </>
                ) : holding ? (
                    holdingLabel
                ) : (
                    label
                )}
            </span>
        </button>
    );
}
