import { useEffect, useState, useRef } from 'react';
import { CarCard, Loader, YandexMap, GeolocationWarning } from '../components';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchAvailableCars } from '../store/slices/carsSlice';
import { setGeolocation, setGeolocationError, setGeolocationLoading } from '../store/slices/uiSlice';
import type { Car } from '../types';

interface HomePageProps {
    onSelectCar: (car: Car) => void;
}

export function HomePage({ onSelectCar }: HomePageProps) {
    const dispatch = useAppDispatch();
    const { cars, isLoading: carsLoading, error } = useAppSelector((state) => state.cars);
    const { geolocation } = useAppSelector((state) => state.ui);
    const { latitude, longitude, isLoading: geoLoading, error: geoError } = geolocation;

    // State for dismissed geolocation warning
    const [geoWarningDismissed, setGeoWarningDismissed] = useState(false);

    // Track if we've already fetched cars
    const hasFetchedCars = useRef(false);

    // Initialize geolocation (non-blocking)
    useEffect(() => {
        if (!navigator.geolocation) {
            dispatch(setGeolocationError('Геолокация не поддерживается браузером'));
            dispatch(setGeolocationLoading(false));
            return;
        }

        dispatch(setGeolocationLoading(true));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                dispatch(setGeolocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                }));
            },
            (err) => {
                let errorMessage = 'Не удалось определить местоположение';
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = 'Доступ к геолокации запрещён';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = 'Местоположение недоступно';
                        break;
                    case err.TIMEOUT:
                        errorMessage = 'Превышено время ожидания';
                        break;
                }
                dispatch(setGeolocationError(errorMessage));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, [dispatch]);

    // Fetch cars - initial load and when geolocation updates
    const prevCoordsRef = useRef<{ lat: number | null; lon: number | null }>({ lat: null, lon: null });

    useEffect(() => {
        // Skip if coordinates haven't changed
        const coordsChanged = prevCoordsRef.current.lat !== latitude || prevCoordsRef.current.lon !== longitude;

        // Fetch on initial mount or when coordinates actually change
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

    // Calculate distance between two points (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Show geolocation warning only after geolocation attempt is complete
    const showGeoWarning = !geoLoading && geoError && !geoWarningDismissed;

    // Only show loading for cars, NOT for geolocation
    if (carsLoading && cars.length === 0) {
        return <Loader fullScreen text="Ищем машины рядом..." />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <svg className="w-16 h-16 text-[var(--tg-theme-hint-color)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-2">Ошибка загрузки</h2>
                <p className="text-sm text-[var(--tg-theme-hint-color)]">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Geolocation Warning */}
            {showGeoWarning && (
                <GeolocationWarning
                    message="Включите геолокацию для точного отображения машин на карте"
                    onDismiss={() => setGeoWarningDismissed(true)}
                />
            )}

            {/* Yandex Map */}
            <div className={`relative w-full h-64 ${showGeoWarning ? 'mt-10' : ''}`}>
                <YandexMap
                    cars={cars}
                    userLocation={latitude && longitude ? { latitude, longitude } : undefined}
                    onCarSelect={onSelectCar}
                    className="rounded-b-2xl"
                />

                {/* Cars count badge */}
                {cars.length > 0 && (
                    <div className="absolute top-4 left-4 bg-[var(--tg-theme-bg-color)] px-3 py-1.5 rounded-full text-xs flex items-center gap-1 shadow-lg z-10">
                        <svg className="w-4 h-4 text-[var(--tg-theme-button-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-[var(--tg-theme-text-color)] font-medium">{cars.length}</span>
                    </div>
                )}

                {/* Geolocation loading indicator */}
                {geoLoading && (
                    <div className="absolute top-4 right-4 bg-[var(--tg-theme-bg-color)] px-3 py-1.5 rounded-full text-xs flex items-center gap-1 shadow-lg z-10">
                        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[var(--tg-theme-hint-color)]">Определение...</span>
                    </div>
                )}
            </div>

            {/* Cars list */}
            <div className="flex-1 overflow-y-auto pb-20">
                <h2 className="text-base font-semibold text-[var(--tg-theme-text-color)] px-4 py-3 sticky top-0 bg-[var(--tg-theme-bg-color)] z-10">
                    Машины рядом
                    {cars.length > 0 && (
                        <span className="ml-1 text-sm font-normal text-[var(--tg-theme-hint-color)]">
                            ({cars.length})
                        </span>
                    )}
                </h2>

                {cars.length === 0 ? (
                    <div className="text-center py-8">
                        <svg className="w-12 h-12 mx-auto text-[var(--tg-theme-hint-color)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <p className="text-[var(--tg-theme-hint-color)]">
                            Рядом нет доступных машин
                        </p>
                    </div>
                ) : (
                    <div>
                        {cars.map((car) => {
                            const distance = latitude && longitude
                                ? calculateDistance(latitude, longitude, car.latitude, car.longitude)
                                : undefined;

                            return (
                                <CarCard
                                    key={car.id}
                                    car={car}
                                    distance={distance}
                                    onSelect={onSelectCar}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
