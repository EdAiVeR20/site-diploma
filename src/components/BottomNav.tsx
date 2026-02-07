import { type ReactNode } from 'react';

interface BottomNavProps {
    activeTab: 'home' | 'history' | 'profile';
    onNavigate: (tab: 'home' | 'history' | 'profile') => void;
}

function NavItem({
    children,
    label,
    isActive,
    onClick
}: {
    children: ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`relative flex flex-col items-center justify-center w-full h-full gap-0.5 touch-manipulation bottom-nav-item ${isActive ? 'active' : ''}`}
        >
            <div className={`transition-colors ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--tg-theme-hint-color)]'}`}>
                {children}
            </div>
            <span className={`text-xs transition-colors ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--tg-theme-hint-color)]'}`}>
                {label}
            </span>
        </button>
    );
}

export function BottomNav({ activeTab, onNavigate }: BottomNavProps) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bottom-nav safe-area-bottom z-50">
            <div className="flex items-center justify-around h-14">
                {/* Home / Map */}
                <NavItem
                    isActive={activeTab === 'home'}
                    onClick={() => onNavigate('home')}
                    label="Карта"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </NavItem>

                {/* History */}
                <NavItem
                    isActive={activeTab === 'history'}
                    onClick={() => onNavigate('history')}
                    label="История"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </NavItem>

                {/* Profile */}
                <NavItem
                    isActive={activeTab === 'profile'}
                    onClick={() => onNavigate('profile')}
                    label="Профиль"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </NavItem>
            </div>
        </nav>
    );
}
