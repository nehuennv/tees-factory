import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Check } from 'lucide-react';
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
 * envíos. Hay que sostener holdDuration ms; al soltar antes se cancela.
 * Accesible por teclado (Enter/Espacio confirman).
 */
export function HoldToConfirmButton({
    onConfirm,
    label,
    holdingLabel = 'Seguí sosteniendo…',
    loadingLabel = 'Procesando…',
    holdDuration = 1500,
    disabled = false,
    isLoading = false,
    className,
}: HoldToConfirmButtonProps) {
    const [progress, setProgress] = useState(0);
    const [holding, setHolding] = useState(false);
    const [done, setDone] = useState(false);
    const rafRef = useRef<number | null>(null);
    const startRef = useRef<number>(0);
    const firedRef = useRef(false);

    const stop = useCallback(() => {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        setHolding(false);
        if (!firedRef.current) setProgress(0);
    }, []);

    const tick = useCallback(() => {
        const elapsed = performance.now() - startRef.current;
        const p = Math.min(1, elapsed / holdDuration);
        setProgress(p);
        if (p >= 1) {
            if (!firedRef.current) {
                firedRef.current = true;
                setHolding(false);
                setDone(true);
                // pequeño pop antes de disparar
                setTimeout(() => onConfirm(), 180);
            }
            return;
        }
        rafRef.current = requestAnimationFrame(tick);
    }, [holdDuration, onConfirm]);

    const start = useCallback(() => {
        if (disabled || isLoading || firedRef.current) return;
        setHolding(true);
        startRef.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
    }, [disabled, isLoading, tick]);

    useEffect(() => {
        if (!isLoading) { firedRef.current = false; setDone(false); if (!holding) setProgress(0); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading]);

    useEffect(() => () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); }, []);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isLoading && !firedRef.current) {
            e.preventDefault();
            firedRef.current = true;
            onConfirm();
        }
    };

    const pct = Math.round(progress * 100);

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
            style={{ transform: done ? 'scale(1.03)' : holding ? 'scale(0.97)' : 'scale(1)' }}
            className={cn(
                'relative overflow-hidden select-none touch-none rounded-xl h-11 px-5 font-bold text-white',
                'bg-zinc-900 hover:bg-zinc-800 shadow-sm',
                'transition-[transform,background-color] duration-150 ease-out',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40',
                className
            )}
        >
            {/* Relleno de progreso con gradiente + borde brillante (rAF, sin transition para que sea fluido) */}
            <span
                className="absolute inset-y-0 left-0 pointer-events-none bg-gradient-to-r from-rose-500 to-rose-600"
                style={{
                    width: `${progress * 100}%`,
                    boxShadow: progress > 0 && progress < 1 ? '6px 0 18px 0 rgba(255,255,255,0.55)' : 'none',
                    borderRight: progress > 0 && progress < 1 ? '2px solid rgba(255,255,255,0.9)' : 'none',
                }}
                aria-hidden="true"
            />
            {/* Brillo sutil que recorre mientras se sostiene */}
            {holding && (
                <span className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                    <span className="absolute inset-y-0 left-0 w-1/4 -skew-x-12 bg-white/25" style={{ animation: 'htc-shine 1.1s linear infinite' }} />
                </span>
            )}
            {/* Línea de progreso brillante al pie */}
            <span
                className="absolute bottom-0 left-0 h-[3px] bg-white/90 pointer-events-none"
                style={{ width: `${progress * 100}%` }}
                aria-hidden="true"
            />

            <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {loadingLabel}
                    </>
                ) : done ? (
                    <>
                        <Check className="w-4 h-4" />
                        ¡Listo!
                    </>
                ) : holding ? (
                    <>
                        {holdingLabel}
                        <span className="tabular-nums opacity-80">{pct}%</span>
                    </>
                ) : (
                    label
                )}
            </span>
        </button>
    );
}
