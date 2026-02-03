import { type ReactNode } from 'react';

interface BottomNavProps {
    activeTab: 'home' | 'history' | 'profile';
    onNavigate: (tab: 'home' | 'history' | 'profile') => void;
}

function NavIcon({ children, isActive }: { children: ReactNode; isActive: boolean }) {
    return (
        <div className={`transition-colors ${isActive ? 'text-[var(--tg-theme-button-color)]' : 'text-[var(--tg-theme-hint-color)]'}`}>
            {children}
        </div>
    );
}

export function BottomNav({ activeTab, onNavigate }: BottomNavProps) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-[var(--tg-theme-bg-color)] border-t border-[var(--tg-theme-hint-color)]/20 safe-area-bottom z-50">
            <div className="flex items-center justify-around h-14">
                {/* Home / Map */}
                <button
                    onClick={() => onNavigate('home')}
                    className="flex flex-col items-center justify-center w-full h-full gap-0.5 touch-manipulation"
                >
                    <NavIcon isActive={activeTab === 'home'}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </NavIcon>
                    <span className={`text-xs ${activeTab === 'home' ? 'text-[var(--tg-theme-button-color)]' : 'text-[var(--tg-theme-hint-color)]'}`}>
                        Карта
                    </span>
                </button>

                {/* History */}
                <button
                    onClick={() => onNavigate('history')}
                    className="flex flex-col items-center justify-center w-full h-full gap-0.5 touch-manipulation"
                >
                    <NavIcon isActive={activeTab === 'history'}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </NavIcon>
                    <span className={`text-xs ${activeTab === 'history' ? 'text-[var(--tg-theme-button-color)]' : 'text-[var(--tg-theme-hint-color)]'}`}>
                        История
                    </span>
                </button>

                {/* Profile */}
                <button
                    onClick={() => onNavigate('profile')}
                    className="flex flex-col items-center justify-center w-full h-full gap-0.5 touch-manipulation"
                >
                    <NavIcon isActive={activeTab === 'profile'}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </NavIcon>
                    <span className={`text-xs ${activeTab === 'profile' ? 'text-[var(--tg-theme-button-color)]' : 'text-[var(--tg-theme-hint-color)]'}`}>
                        Профиль
                    </span>
                </button>
            </div>
        </nav>
    );
}
