import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import MainHeader from './main-content/MainHeader';
import type { MainHeaderProps } from './main-content/MainHeader';

interface MainLayoutProps {
    children: React.ReactNode;
    headerProps?: MainHeaderProps;
    hideHeader?: boolean;
}

export default function MainLayout({ children, headerProps, hideHeader = false }: MainLayoutProps) {
    const location = useLocation();

    return (
        <div className="flex h-screen w-full overflow-hidden bg-zinc-100/60 p-4 gap-4">
            {/* Sidebar - injected here */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 bg-white border border-zinc-200/60 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative h-full">
                {!hideHeader && <MainHeader {...headerProps} />}
                <main className="flex-1 flex flex-col relative overflow-hidden bg-[#fafafa]">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
                        className="h-full w-full flex flex-col overflow-hidden"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}