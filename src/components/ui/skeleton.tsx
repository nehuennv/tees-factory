import { cn } from '@/lib/utils';

/** Bloque de carga (shimmer) reutilizable. Solo CSS, sin JS por frame. */
export function Skeleton({ className }: { className?: string }) {
    return <div className={cn('animate-pulse rounded-md bg-zinc-100', className)} />;
}

/**
 * Filas skeleton para una <Table>. Renderiza `rows` x `cols` celdas con
 * barras de ancho variado para simular contenido real.
 */
export function TableSkeletonRows({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, r) => (
                <tr key={r} className="border-b border-zinc-100">
                    {Array.from({ length: cols }).map((_, c) => (
                        <td key={c} className="px-4 py-3.5">
                            <Skeleton className={cn('h-4', c === 0 ? 'w-28' : c === cols - 1 ? 'w-16 ml-auto' : 'w-20')} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}
