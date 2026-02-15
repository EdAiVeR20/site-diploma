import { useEffect, useRef } from 'react';
import { useAppSelector } from '../store';
import { useTelegram } from '../hooks/useTelegram';

interface SideDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (page: 'history' | 'profile') => void;
}

export function SideDrawer({ isOpen, onClose, onNavigate }: SideDrawerProps) {
    const drawerRef = useRef<HTMLDivElement>(null);
    const { user: tgUser } = useTelegram();
    const { telegramUser } = useAppSelector((state) => state.auth);

    // Get user info from TG SDK or Redux
    const displayUser = tgUser || telegramUser;
    const displayName = displayUser
        ? `${displayUser.firstName}${displayUser.lastName ? ' ' + displayUser.lastName : ''}`
        : 'GoShare';
    const displayUsername = displayUser?.username ? `@${displayUser.username}` : 'Каршеринг';
    const photoUrl = tgUser?.photoUrl || null;
    const initial = displayUser?.firstName?.charAt(0) || 'G';

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleNavigate = (page: 'history' | 'profile') => {
        onNavigate(page);
        onClose();
    };

    // Click on avatar/name area -> profile
    const handleAvatarClick = () => {
        handleNavigate('profile');
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                ref={drawerRef}
                className={`fixed top-0 left-0 h-full w-72 bg-[var(--tg-theme-bg-color)] z-50 transform transition-transform duration-300 ease-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header - User Info (clickable -> profile) */}
                <div
                    className="p-6 border-b border-[var(--tg-theme-hint-color)]/20 cursor-pointer active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors"
                    onClick={handleAvatarClick}
                >
                    <div className="flex items-center gap-4">
                        {photoUrl ? (
                            <img
                                src={photoUrl}
                                alt={displayName}
                                className="w-14 h-14 rounded-full object-cover border-2 border-[var(--color-accent)]"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-xl font-bold">
                                {initial}
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-bold text-[var(--tg-theme-text-color)] truncate">{displayName}</h2>
                            <p className="text-sm text-[var(--tg-theme-hint-color)] truncate">{displayUsername}</p>
                        </div>
                        <svg className="w-5 h-5 text-[var(--tg-theme-hint-color)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="py-4">
                    <button
                        onClick={() => handleNavigate('profile')}
                        className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-[var(--tg-theme-secondary-bg-color)] transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-center">
                            <svg className="w-5 h-5 text-[var(--tg-theme-hint-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium text-[var(--tg-theme-text-color)]">Профиль</p>
                            <p className="text-xs text-[var(--tg-theme-hint-color)]">Баланс, верификация</p>
                        </div>
                    </button>

                    <button
                        onClick={() => handleNavigate('history')}
                        className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-[var(--tg-theme-secondary-bg-color)] transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-center">
                            <svg className="w-5 h-5 text-[var(--tg-theme-hint-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium text-[var(--tg-theme-text-color)]">История поездок</p>
                            <p className="text-xs text-[var(--tg-theme-hint-color)]">Прошлые аренды</p>
                        </div>
                    </button>
                </nav>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-[var(--tg-theme-hint-color)]/20">
                    <p className="text-xs text-[var(--tg-theme-hint-color)] text-center">
                        GoShare v1.0.0
                    </p>
                </div>
            </div>
        </>
    );
}
