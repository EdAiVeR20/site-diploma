import { useEffect, useRef, useCallback, useMemo } from 'react';
import type { Car } from '../types';

// Lazy-load the reactified ymaps components
const ymapsReady = (async () => {
    await ymaps3.ready;
    const reactifyModule = await ymaps3.import('@yandex/ymaps3-reactify');
    const React = await import('react');
    const ReactDOM = await import('react-dom');
    const reactify = reactifyModule.reactify.bindTo(React, ReactDOM);
    const components = reactify.module(ymaps3);
    return { components, reactify };
})();

interface YandexMapProps {
    cars: Car[];
    userLocation?: {
        latitude: number;
        longitude: number;
    };
    onCarSelect?: (car: Car) => void;
    onCarOpen?: (car: Car) => void;
    selectedCarId?: string;
    centerOnUserTrigger?: number;
    className?: string;
    isDark: boolean;
}

// We need to await the module at the top level (Vite supports top-level await)
const { components, reactify } = await ymapsReady;
const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = components;

const DEFAULT_CENTER: [number, number] = [37.6173, 55.7558];
const DEFAULT_ZOOM = 12;

const YandexMapContent = ({
    cars,
    userLocation,
    onCarSelect,
    onCarOpen,
    selectedCarId,
    centerOnUserTrigger,
    isDark
}: YandexMapProps) => {
    // Ref to the native YMap instance — used for imperative setLocation()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ymaps3 reactified components don't expose typed ref
    const mapRef = useRef<any>(null);
    const hasCenteredOnUser = useRef(false);
    const prevCenterTrigger = useRef(centerOnUserTrigger);
    const prevSelectedCarId = useRef(selectedCarId);

    // Initial location — computed only once on mount
    const initialLocation = useMemo(() => {
        if (userLocation) {
            hasCenteredOnUser.current = true;
            return {
                center: [userLocation.longitude, userLocation.latitude] as [number, number],
                zoom: 15
            };
        }
        return { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intentionally empty — only computed on mount

    // useDefault only sets the initial/default position (uncontrolled mode)
    const defaultLocation = reactify.useDefault(initialLocation);

    // Smooth pan to a coordinate using the imperative map API
    const panTo = useCallback((center: [number, number], zoom: number) => {
        if (mapRef.current) {
            mapRef.current.setLocation({ center, zoom, duration: 400 });
        }
    }, []);

    // Center on user when location first becomes available (one-time)
    useEffect(() => {
        if (userLocation && !hasCenteredOnUser.current) {
            hasCenteredOnUser.current = true;
            panTo([userLocation.longitude, userLocation.latitude], 15);
        }
    }, [userLocation, panTo]);

    // Handle centerOnUserTrigger changes (location button pressed)
    useEffect(() => {
        if (centerOnUserTrigger !== prevCenterTrigger.current && userLocation) {
            prevCenterTrigger.current = centerOnUserTrigger;
            panTo([userLocation.longitude, userLocation.latitude], 16);
        }
    }, [centerOnUserTrigger, userLocation, panTo]);

    // Center on selected car — only when selectedCarId actually CHANGES
    useEffect(() => {
        if (selectedCarId && selectedCarId !== prevSelectedCarId.current) {
            prevSelectedCarId.current = selectedCarId;
            const car = cars.find(c => c.id === selectedCarId);
            if (car) {
                panTo([car.longitude, car.latitude], 16);
            }
        } else if (!selectedCarId) {
            prevSelectedCarId.current = undefined;
        }
    }, [selectedCarId, cars, panTo]);

    // Handle marker tap: re-click on selected → open details
    const handleMarkerTap = useCallback((car: Car) => {
        if (car.id === selectedCarId) {
            onCarOpen?.(car);
        } else {
            onCarSelect?.(car);
        }
    }, [selectedCarId, onCarSelect, onCarOpen]);

    // Find the best price to show on selected marker
    const getMarkerPrice = (car: Car) => {
        const minuteTariff = car.tariffs.find(t => t.type === 'minute');
        const hourlyTariff = car.tariffs.find(t => t.type === 'hourly');
        if (minuteTariff) return `${minuteTariff.pricePerUnit} ₽/мин`;
        if (hourlyTariff) return `${hourlyTariff.pricePerUnit} ₽/час`;
        return '';
    };

    return (
        <YMap
            ref={mapRef}
            location={defaultLocation}
            theme={isDark ? 'dark' : 'light'}
        >
            <YMapDefaultSchemeLayer />
            <YMapDefaultFeaturesLayer />

            {/* User Location Marker — updates reactively without map remount */}
            {userLocation && (
                <YMapMarker coordinates={[userLocation.longitude, userLocation.latitude]}>
                    <div className="relative" style={{ transform: 'translate(-50%, -50%)' }}>
                        <div className="w-5 h-5 bg-blue-500 rounded-full shadow-lg border-2 border-white"></div>
                        <div className="absolute inset-0 w-5 h-5 bg-blue-400/40 rounded-full animate-ping"></div>
                    </div>
                </YMapMarker>
            )}

            {/* Car Markers */}
            {cars.map((car) => {
                const isSelected = car.id === selectedCarId;
                const priceText = isSelected ? getMarkerPrice(car) : '';

                return (
                    <YMapMarker
                        key={car.id}
                        coordinates={[car.longitude, car.latitude]}
                        onClick={() => handleMarkerTap(car)}
                    >
                        <div
                            className={`relative cursor-pointer transition-all duration-200 ${isSelected ? 'z-50 scale-125' : 'z-10'}`}
                            style={{ transform: 'translate(-50%, -100%)' }}
                        >
                            <div className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center border-2 border-white transition-all ${isSelected
                                ? 'bg-gradient-to-br from-green-400 to-green-600'
                                : 'bg-gradient-to-br from-violet-500 to-purple-600'
                                }`}>
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                                </svg>
                            </div>

                            <div className={`absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-0 h-0 
                                border-l-[6px] border-r-[6px] border-t-[8px] border-transparent ${isSelected ? 'border-t-green-600' : 'border-t-purple-600'
                                }`}></div>

                            {isSelected && priceText && (
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 
                                    bg-[var(--tg-theme-bg-color)] px-2 py-1 rounded-lg shadow-lg 
                                    text-xs font-semibold whitespace-nowrap border border-[var(--color-accent)]/30
                                ">
                                    <span className="text-[var(--color-accent)]">{priceText}</span>
                                </div>
                            )}
                        </div>
                    </YMapMarker>
                );
            })}
        </YMap>
    );
};

export default YandexMapContent;
