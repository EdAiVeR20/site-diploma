import { Suspense, lazy } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import type { Car } from '../types';

// Lazy load the map content to avoid blocking app initialization
const YandexMapContent = lazy(() => import('./YandexMapContent'));

interface YandexMapProps {
    cars: Car[];
    userLocation?: {
        latitude: number;
        longitude: number;
    };
    onCarSelect?: (car: Car) => void;
    onCarDoubleTap?: (car: Car) => void;
    selectedCarId?: string;
    centerOnUserTrigger?: number;
    className?: string;
}

// Loading Component
const MapLoader = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[var(--tg-theme-secondary-bg-color)]">
        <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[var(--tg-theme-hint-color)]">Загрузка карты...</span>
        </div>
    </div>
);

export function YandexMap(props: YandexMapProps) {
    const { colorScheme } = useTelegram();
    const isDark = colorScheme === 'dark';

    return (
        <div className={`relative w-full h-full ${props.className || ''} overflow-hidden`}>
            <Suspense fallback={<MapLoader />}>
                <YandexMapContent {...props} isDark={isDark} />
            </Suspense>
        </div>
    );
}
