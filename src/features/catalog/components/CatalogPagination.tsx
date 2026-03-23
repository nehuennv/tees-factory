import { Button } from '@/components/ui/button';

export default function CatalogPagination() {
    return (
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-zinc-100">
            <span className="text-sm text-zinc-500">
                Mostrando <strong className="font-medium text-zinc-900">1-3</strong> de <strong className="font-medium text-zinc-900">84</strong> productos
            </span>
            <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl px-4 py-2 border-zinc-200 text-zinc-900 shadow-sm h-10 text-sm font-medium">
                    Anterior
                </Button>
                <Button variant="outline" className="rounded-xl px-4 py-2 border-zinc-200 text-zinc-900 shadow-sm h-10 text-sm font-medium">
                    Siguiente
                </Button>
            </div>
        </div>
    );
}
