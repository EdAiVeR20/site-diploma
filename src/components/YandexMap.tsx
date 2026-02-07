import { Suspense, lazy } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import type { Car } from '../types';

// Lazy load the map content to avoid blocking app initialization
// because YandexMapContent uses top-level await for ymaps3
const YandexMapContent = lazy(() => import('./YandexMapContent'));

interface YandexMapProps {
    cars: Car[];
    userLocation?: {
        latitude: number;
        longitude: number;
    };
    onCarSelect?: (car: Car) => void;
    className?: string;
}

// Loading Component
const MapLoader = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Загрузка карт v3...</span>
        </div>
    </div>
);

export function YandexMap(props: YandexMapProps) {
    const { colorScheme } = useTelegram();
    const isDark = colorScheme === 'dark';

    return (
        <div className={`relative w-full h-full ${props.className || ''} rounded-2xl overflow-hidden`}>
            <Suspense fallback={<MapLoader />}>
                <YandexMapContent {...props} isDark={isDark} />
            </Suspense>
        </div>
    );
}
