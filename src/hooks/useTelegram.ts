import { useEffect, useState, useCallback } from 'react';
import type { TelegramUser } from '../types';

// Type for Telegram WebApp from global declaration
type TelegramWebApp = NonNullable<typeof window.Telegram>['WebApp'];

interface UseTelegramReturn {
    tg: TelegramWebApp | null;
    user: TelegramUser | null;
    isReady: boolean;
    colorScheme: 'light' | 'dark';
    viewportHeight: number;
    showMainButton: (text: string, onClick: () => void) => void;
    hideMainButton: () => void;
    showBackButton: (onClick: () => void) => void;
    hideBackButton: () => void;
    hapticFeedback: (type: 'success' | 'error' | 'warning' | 'light' | 'medium' | 'heavy') => void;
    showAlert: (message: string) => Promise<void>;
    showConfirm: (message: string) => Promise<boolean>;
    close: () => void;
}

export function useTelegram(): UseTelegramReturn {
    const [isReady, setIsReady] = useState(false);
    const [user, setUser] = useState<TelegramUser | null>(null);
    const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

    // Initialize Telegram WebApp synchronously
    useEffect(() => {
        if (!tg) return;

        // Initialize Telegram WebApp
        tg.ready();
        tg.expand();

        // Apply theme colors to CSS variables
        if (tg.themeParams) {
            const root = document.documentElement;
            if (tg.themeParams.bg_color) root.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
            if (tg.themeParams.text_color) root.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
            if (tg.themeParams.hint_color) root.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color);
            if (tg.themeParams.link_color) root.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color);
            if (tg.themeParams.button_color) root.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color);
            if (tg.themeParams.button_text_color) root.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color);
            if (tg.themeParams.secondary_bg_color) root.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color);
        }

        // Parse user data
        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
            setUser({
                id: tgUser.id,
                firstName: tgUser.first_name,
                lastName: tgUser.last_name,
                username: tgUser.username,
                photoUrl: tgUser.photo_url,
                languageCode: tgUser.language_code,
            });
        }

        // Set initial state
        setColorScheme(tg.colorScheme);
        setViewportHeight(tg.viewportStableHeight || window.innerHeight);
        setIsReady(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showMainButton = useCallback((text: string, onClick: () => void) => {
        if (!tg) return;
        tg.MainButton.setText(text);
        tg.MainButton.onClick(onClick);
        tg.MainButton.show();
    }, [tg]);

    const hideMainButton = useCallback(() => {
        if (!tg) return;
        tg.MainButton.hide();
    }, [tg]);

    const showBackButton = useCallback((onClick: () => void) => {
        if (!tg) return;
        tg.BackButton.onClick(onClick);
        tg.BackButton.show();
    }, [tg]);

    const hideBackButton = useCallback(() => {
        if (!tg) return;
        tg.BackButton.hide();
    }, [tg]);

    const hapticFeedback = useCallback((type: 'success' | 'error' | 'warning' | 'light' | 'medium' | 'heavy') => {
        if (!tg) return;
        if (['success', 'error', 'warning'].includes(type)) {
            tg.HapticFeedback.notificationOccurred(type as 'success' | 'error' | 'warning');
        } else {
            tg.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy');
        }
    }, [tg]);

    const showAlert = useCallback((message: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!tg) {
                alert(message);
                resolve();
                return;
            }
            tg.showAlert(message, resolve);
        });
    }, [tg]);

    const showConfirm = useCallback((message: string): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!tg) {
                resolve(confirm(message));
                return;
            }
            tg.showConfirm(message, (confirmed) => resolve(confirmed));
        });
    }, [tg]);

    const close = useCallback(() => {
        tg?.close();
    }, [tg]);

    return {
        tg: tg ?? null,
        user,
        isReady,
        colorScheme,
        viewportHeight,
        showMainButton,
        hideMainButton,
        showBackButton,
        hideBackButton,
        hapticFeedback,
        showAlert,
        showConfirm,
        close,
    };
}
