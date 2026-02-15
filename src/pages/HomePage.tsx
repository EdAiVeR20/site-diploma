import { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import { YandexMap, GeolocationWarning, LocationButton, CarCarousel } from '../components';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchAvailableCars } from '../store/slices/carsSlice';
import type { Car } from '../types';

interface HomePageProps {
    onSelectCar: (car: Car) => void;
    onOpenDrawer: () => void;
}

export const HomePage = memo(function HomePage({ onSelectCar, onOpenDrawer }: HomePageProps) {
    const dispatch = useAppDispatch();
    const { cars, isLoading: carsLoading } = useAppSelector((state) => state.cars);
    const { geolocation } = useAppSelector((state) => state.ui);
    const { latitude, longitude, isLoading: geoLoading, error: geoError } = geolocation;

    // Local state
    const [geoWarningDismissed, setGeoWarningDismissed] = useState(false);
    const [selectedCarId, setSelectedCarId] = useState<string | undefined>();
    const [centerOnUserTrigger, setCenterOnUserTrigger] = useState(0);

    // Refs for dedup
    const hasFetchedCars = useRef(false);
    const prevCoordsRef = useRef<{ lat: number | null; lon: number | null }>({ lat: null, lon: null });

    // Fetch cars (NO geolocation logic here — handled by useGeolocation in App)
    useEffect(() => {
        const coordsChanged = prevCoordsRef.current.lat !== latitude || prevCoordsRef.current.lon !== longitude;

        if (!hasFetchedCars.current || (coordsChanged && latitude !== null && longitude !== null)) {
            hasFetchedCars.current = true;
            prevCoordsRef.current = { lat: latitude, lon: longitude };

            dispatch(fetchAvailableCars({
                lat: latitude ?? undefined,
                lon: longitude ?? undefined,
                radius: 5,
            }));
        }
    }, [dispatch, latitude, longitude]);

    // Memoized handlers
    const handleCarSelect = useCallback((car: Car) => {
        setSelectedCarId(car.id);
    }, []);

    const handleCarDoubleTap = useCallback((car: Car) => {
        onSelectCar(car);
    }, [onSelectCar]);

    const handleCenterOnUser = useCallback(() => {
        setCenterOnUserTrigger(prev => prev + 1);
        setSelectedCarId(undefined);
    }, []);

    const handleDismissGeoWarning = useCallback(() => {
        setGeoWarningDismissed(true);
    }, []);

    const showGeoWarning = !geoLoading && geoError && !geoWarningDismissed;

    const userLocation = useMemo(
        () => latitude && longitude ? { latitude, longitude } : undefined,
        [latitude, longitude]
    );

    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* Geolocation Warning */}
            {showGeoWarning && (
                <div className="absolute top-0 left-0 right-0 z-40">
                    <GeolocationWarning
                        message="Включите геолокацию для точного определения машин"
                        onDismiss={handleDismissGeoWarning}
                    />
                </div>
            )}

            {/* Hamburger menu button */}
            <button
                onClick={onOpenDrawer}
                className="absolute top-4 left-4 z-30 w-12 h-12 rounded-full bg-[var(--tg-theme-bg-color)] shadow-lg flex items-center justify-center border border-[var(--tg-theme-hint-color)]/20"
                aria-label="Открыть меню"
            >
                <svg className="w-6 h-6 text-[var(--tg-theme-text-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Location button */}
            <div className="absolute top-1/2 right-4 z-30 transform -translate-y-1/2">
                <LocationButton onClick={handleCenterOnUser} />
            </div>

            {/* Full-screen map */}
            <YandexMap
                cars={cars}
                userLocation={userLocation}
                onCarSelect={handleCarSelect}
                onCarDoubleTap={handleCarDoubleTap}
                selectedCarId={selectedCarId}
                centerOnUserTrigger={centerOnUserTrigger}
                className="!rounded-none"
            />

            {/* Loading overlay */}
            {carsLoading && cars.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
                    <div className="bg-[var(--tg-theme-bg-color)] rounded-xl p-4 flex items-center gap-3 shadow-xl">
                        <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[var(--tg-theme-text-color)]">Ищем машины...</span>
                    </div>
                </div>
            )}

            {/* Geolocation loading indicator */}
            {geoLoading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[var(--tg-theme-bg-color)] px-3 py-2 rounded-full shadow-lg flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-[var(--tg-theme-hint-color)]">Определяем...</span>
                </div>
            )}

            {/* Car Carousel at bottom */}
            {cars.length > 0 && (
                <CarCarousel
                    cars={cars}
                    selectedCarId={selectedCarId}
                    onCarSelect={handleCarSelect}
                    onCarDoubleTap={handleCarDoubleTap}
                    userLatitude={latitude ?? undefined}
                    userLongitude={longitude ?? undefined}
                />
            )}
        </div>
    );
});
