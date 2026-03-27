import React from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { CartWidget } from './CartWidget';
import { InfoTooltip } from '@/components/shared/InfoTooltip';

export interface HeaderTab {
    id: string;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
}

export interface MainHeaderProps {
    title?: string;
    showBack?: boolean;
    backUrl?: string;
    tabs?: HeaderTab[];
    searchPlaceholder?: string;
    onSearch?: (value: string) => void;
    primaryAction?: {
        label: string;
        onClick?: () => void;
    };
    customActions?: React.ReactNode;
    tooltipInfo?: string;
}

export default function MainHeader({
    title = 'Vantra Portal',
    showBack = false,
    backUrl,
    tabs = [],
    searchPlaceholder,
    onSearch,
    primaryAction,
    customActions,
    tooltipInfo
}: MainHeaderProps) {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    return (
        <header className="w-full bg-white/80 backdrop-blur-md border-b border-zinc-200 shadow-[0_4px_24px_currentColor] shadow-zinc-900/5 px-6 py-4 flex items-center justify-between rounded-t-3xl md:rounded-tr-[24px] md:rounded-tl-none relative z-10 shrink-0 min-h-[73px]">
            <div className="flex items-center gap-8">
                {showBack ? (
                    <button
                        onClick={() => backUrl ? navigate(backUrl) : navigate(-1)}
                        className="flex items-center gap-2 text-xl font-bold text-zinc-900 hover:text-zinc-600 transition-colors -ml-2 px-2 py-1 rounded-xl"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        {title}
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-zinc-900">{title}</h1>
                        {tooltipInfo && (
                            <InfoTooltip
                                content={tooltipInfo}
                                align="start"
                                className="hidden md:flex ml-1 translate-y-[1px]"
                            />
                        )}
                    </div>
                )}

                {tabs.length > 0 && (
                    <nav className="flex gap-6 mt-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={tab.onClick}
                                className={`text-sm pb-4 -mb-[18px] transition-colors ${tab.isActive
                                    ? 'font-semibold text-zinc-900 border-b-2 border-zinc-900'
                                    : 'font-medium text-zinc-400 hover:text-zinc-600'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                )}
            </div>

            <div className="flex items-center gap-3">
                {searchPlaceholder && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            onChange={(e) => onSearch?.(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 placeholder:text-zinc-400"
                        />
                    </div>
                )}

                {user?.role === 'CLIENT' && (
                    <CartWidget />
                )}

                {customActions}

                {primaryAction && (
                    <Button
                        onClick={primaryAction.onClick}
                        className="bg-zinc-900 text-white rounded-lg px-4 py-2 text-sm"
                    >
                        {primaryAction.label}
                    </Button>
                )}
            </div>
        </header>
    );
}
