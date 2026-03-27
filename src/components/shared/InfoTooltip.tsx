import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface InfoTooltipProps {
    content: React.ReactNode | string;
    /** 
     * 'light' = se usa sobre un fondo claro (ícono gris que oscurece al hover)
     * 'dark' = se usa sobre un fondo oscuro (ícono gris oscuro que aclara al hover)
     */
    theme?: 'light' | 'dark';
    className?: string; // Wrapper class
    iconClassName?: string; // Icon inner class
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
}

export function InfoTooltip({
    content,
    theme = 'light',
    className,
    iconClassName,
    side = 'bottom',
    align = 'center'
}: InfoTooltipProps) {
    if (!content) return null;

    return (
        <TooltipProvider delayDuration={150}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "inline-flex items-center justify-center rounded-full focus:outline-none transition-transform hover:scale-105",
                            className
                        )}
                    >
                        <HelpCircle
                            className={cn(
                                "w-3.5 h-3.5 transition-colors", // Muy discreto
                                theme === 'light'
                                    ? "text-zinc-300 hover:text-zinc-500"
                                    : "text-zinc-500 hover:text-zinc-300",
                                iconClassName
                            )}
                            strokeWidth={2.5}
                        />
                    </button>
                </TooltipTrigger>
                <TooltipContent
                    side={side}
                    align={align}
                    sideOffset={8}
                    className="bg-zinc-900 text-zinc-50 text-xs max-w-[260px] p-2.5 rounded-lg border border-zinc-800 shadow-xl leading-relaxed z-[100]"
                >
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
