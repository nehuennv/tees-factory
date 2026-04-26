import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface ActionListCardProps {
    title: string;
    actionText: string;
    actionRoute: string;
    children: React.ReactNode;
    fakeContinuationItems?: React.ReactNode;
}

export function ActionListCard({
    title,
    actionText,
    actionRoute,
    children,
    fakeContinuationItems
}: ActionListCardProps) {
    const navigate = useNavigate();

    return (
        <Card className="flex-1 flex flex-col overflow-hidden bg-white border border-zinc-200 shadow-sm rounded-xl hover:shadow-md transition-shadow duration-300">
            {/* HEADER: Con un fondo muy sutil para separarlo del contenido */}
            <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 py-3.5 px-5">
                <CardTitle className="text-sm font-bold text-zinc-900 tracking-tight">
                    {title}
                </CardTitle>
            </CardHeader>

            {/* CONTENIDO: Estructura compacta que se ajusta a los items */}
            <CardContent className="p-0 relative overflow-hidden bg-white min-h-0">
                <div className="flex flex-col w-full px-5 pt-4 pb-0 z-0 space-y-3">
                    {/* Items Reales */}
                    {children}

                    {/* Items Falsos (En el flujo para que se corten naturalmente) */}
                    {fakeContinuationItems && (
                        <div className="pointer-events-none select-none space-y-3">
                            {fakeContinuationItems}
                        </div>
                    )}
                </div>

                {/* GRADIENTE: Sutil para indicar continuación sin robar espacio */}
            </CardContent>

            {/* FOOTER: Usando el componente nativo de shadcn */}
            <CardFooter className="p-0 border-t border-zinc-100 z-10 bg-white">
                <Button
                    variant="ghost"
                    onClick={() => navigate(actionRoute)}
                    className="w-full h-12 rounded-none rounded-b-xl text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                >
                    {actionText}
                    <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                </Button>
            </CardFooter>
        </Card>
    );
}