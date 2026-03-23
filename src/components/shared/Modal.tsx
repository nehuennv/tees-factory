import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ModalAction {
    label: string;
    onClick: () => void | Promise<void>;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    disabled?: boolean;
    isLoading?: boolean;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    primaryAction?: ModalAction;
    secondaryAction?: ModalAction;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    hideCloseButton?: boolean;
    preventCloseOnOutsideClick?: boolean;
}

const maxWidthMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-[calc(100vw-2rem)]',
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    primaryAction,
    secondaryAction,
    maxWidth = 'md',
    hideCloseButton = false,
    preventCloseOnOutsideClick = false,
}) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !preventCloseOnOutsideClick) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, preventCloseOnOutsideClick]);

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !preventCloseOnOutsideClick) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={handleBackdropClick}
                        aria-hidden="true"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={cn(
                            "relative w-full bg-white rounded-xl shadow-xl flex flex-col z-50 overflow-hidden",
                            maxWidthMap[maxWidth]
                        )}
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Header */}
                        {(title || !hideCloseButton) && (
                            <div className={cn(
                                "flex items-start justify-between px-6 pt-6",
                                children ? "pb-4 border-b border-zinc-100/50" : "pb-6"
                            )}>
                                <div className="flex flex-col gap-1 pr-6">
                                    {title && <h2 className="text-xl font-bold text-zinc-900 leading-tight">{title}</h2>}
                                    {description && <p className="text-sm text-zinc-500">{description}</p>}
                                </div>
                                {!hideCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="absolute right-4 top-4 p-2 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                                        aria-label="Cerrar modal"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Body - Flexible container that scrolls if content is too long */}
                        {children && (
                            <div className="px-6 py-6 overflow-y-auto max-h-[calc(100vh-16rem)]">
                                {children}
                            </div>
                        )}

                        {/* Footer / Actions */}
                        {(footer || primaryAction || secondaryAction) && (
                            <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100/80 flex items-center justify-end gap-3 rounded-b-xl">
                                {footer ? (
                                    footer
                                ) : (
                                    <>
                                        {secondaryAction && (
                                            <Button
                                                variant={secondaryAction.variant || "outline"}
                                                onClick={secondaryAction.onClick}
                                                disabled={secondaryAction.disabled || secondaryAction.isLoading}
                                                className="rounded-lg font-semibold border-zinc-200"
                                            >
                                                {secondaryAction.label}
                                            </Button>
                                        )}
                                        {primaryAction && (
                                            <Button
                                                variant={primaryAction.variant || "default"}
                                                onClick={primaryAction.onClick}
                                                disabled={primaryAction.disabled || primaryAction.isLoading}
                                                className={cn(
                                                    "rounded-lg font-semibold",
                                                    (primaryAction.variant === 'default' || !primaryAction.variant) && "bg-zinc-900 text-white hover:bg-zinc-800"
                                                )}
                                            >
                                                {primaryAction.isLoading ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className=" animate-spin h-4 w-4" />
                                                        Procesando...
                                                    </span>
                                                ) : primaryAction.label}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
