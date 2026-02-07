import { useState, useEffect } from 'react';
import type { Car } from '../types';
import type { YMapLocationRequest } from '@yandex/ymaps3-types';
import { reactify } from '../utils/ymaps';

// Import components from utility with top-level await
// This makes this module async
const {
    YMap,
    YMapDefaultSchemeLayer,
    YMapDefaultFeaturesLayer,
    YMapMarker
} = await import('../utils/ymaps');

interface YandexMapProps {
    cars: Car[];
    userLocation?: {
        latitude: number;
        longitude: number;
    };
    onCarSelect?: (car: Car) => void;
    className?: string;
    isDark: boolean;
}

const YandexMapContent = ({ cars, userLocation, onCarSelect, isDark }: YandexMapProps) => {
    // Initial camera position (Moscow)
    const LOCATION: YMapLocationRequest = {
        center: [37.6173, 55.7558], // [lon, lat]
        zoom: 12
    };

    const [location, setLocation] = useState(LOCATION);

    // Update location when user position changes
    useEffect(() => {
        if (userLocation) {
            setLocation({
                center: [userLocation.longitude, userLocation.latitude],
                zoom: 14,
                duration: 1000
            });
        }
    }, [userLocation]);

    return (
        // @ts-ignore - types mismatch for reactified components
        <YMap
            location={reactify.useDefault(location)}
            theme={isDark ? 'dark' : 'light'}
        >
            <YMapDefaultSchemeLayer />
            <YMapDefaultFeaturesLayer />

            {/* User Location Marker */}
            {userLocation && (
                <YMapMarker coordinates={[userLocation.longitude, userLocation.latitude]}>
                    <div className="relative" style={{ transform: 'translate(-50%, -50%)' }}>
                        <div className="w-6 h-6 bg-blue-500 rounded-full shadow-lg border-2 border-white animate-pulse"></div>
                        <div className="absolute inset-0 w-6 h-6 bg-blue-500/30 rounded-full animate-ping"></div>
                    </div>
                </YMapMarker>
            )}

            {/* Car Markers */}
            {cars.map((car) => {
                const hourlyTariff = car.tariffs.find(t => t.type === 'hourly');
                const priceText = hourlyTariff ? `${hourlyTariff.pricePerUnit} ₽` : '';

                return (
                    <YMapMarker
                        key={car.id}
                        coordinates={[car.longitude, car.latitude]}
                        onClick={() => onCarSelect?.(car)}
                    >
                        <div className="relative group cursor-pointer" style={{ width: '40px', height: '40px', transform: 'translate(-50%, -100%)' }}>
                            {/* Marker Icon */}
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center border-2 border-white transition-transform group-hover:scale-110">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                                </svg>
                            </div>

                            {/* Triangle */}
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent border-t-purple-600"></div>

                            {/* Info Popup */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 w-32">
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 text-center border border-gray-100 dark:border-gray-700">
                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{car.brand}</p>
                                    <p className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">{priceText}</p>
                                </div>
                            </div>
                        </div>
                    </YMapMarker>
                );
            })}
        </YMap>
    );
};

export default YandexMapContent;
