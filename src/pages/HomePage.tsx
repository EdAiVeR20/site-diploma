import { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import { YandexMap, GeolocationWarning, LocationButton, CarCarousel, Button } from '../components';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchAvailableCars } from '../store/slices/carsSlice';
import type { Car } from '../types';

interface HomePageProps {
    onSelectCar: (car: Car) => void;
    onOpenDrawer: () => void;
    isDrawerOpen?: boolean;
}

/** Retry delays: 5s, 10s, 30s, then 30s forever */
function getRetryDelay(retryCount: number): number {
    if (retryCount <= 1) return 5000;
    if (retryCount <= 3) return 10000;
    return 30000;
}

function getCarClass(car: Car): string {
    const tariff = car.tariffs.find(t => t.type === 'hourly');
    if (!tariff) return 'Стандарт';
    if (tariff.pricePerUnit >= 1000) return 'Премиум';
    if (tariff.pricePerUnit >= 600) return 'Бизнес';
    if (tariff.pricePerUnit >= 400) return 'Comfort';
    return 'Эконом';
}

export const HomePage = memo(function HomePage({ onSelectCar, onOpenDrawer, isDrawerOpen }: HomePageProps) {
    const dispatch = useAppDispatch();
    const { cars, isLoading: carsLoading, error: carsError, hasInitiallyLoaded, retryCount } = useAppSelector((state) => state.cars);
    const { geolocation } = useAppSelector((state) => state.ui);
    const { latitude, longitude, isLoading: geoLoading, error: geoError } = geolocation;

    // Local state
    const [geoWarningDismissed, setGeoWarningDismissed] = useState(false);
    const [selectedCarId, setSelectedCarId] = useState<string | undefined>();
    const [centerOnUserTrigger, setCenterOnUserTrigger] = useState(0);
    const [errorDismissed, setErrorDismissed] = useState(false);
    const [expandedCar, setExpandedCar] = useState<Car | null>(null);

    // Refs for dedup
    const hasFetchedCars = useRef(false);
    const prevCoordsRef = useRef<{ lat: number | null; lon: number | null }>({ lat: null, lon: null });
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch cars
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

    // Auto-retry on error
    useEffect(() => {
        if (carsError && hasInitiallyLoaded) {
            const delay = getRetryDelay(retryCount);

            retryTimerRef.current = setTimeout(() => {
                dispatch(fetchAvailableCars({
                    lat: latitude ?? undefined,
                    lon: longitude ?? undefined,
                    radius: 5,
                }));
            }, delay);

            setErrorDismissed(false);

            return () => {
                if (retryTimerRef.current) {
                    clearTimeout(retryTimerRef.current);
                }
            };
        }
    }, [carsError, retryCount, hasInitiallyLoaded, dispatch, latitude, longitude]);

    // Handlers
    const handleCarSelect = useCallback((car: Car) => {
        setSelectedCarId(car.id);
        setExpandedCar(null);
    }, []);

    const handleCarOpen = useCallback((car: Car) => {
        setExpandedCar(car);
    }, []);

    const handleCloseExpanded = useCallback(() => {
        setExpandedCar(null);
    }, []);

    const handleRentCar = useCallback(() => {
        if (expandedCar) {
            onSelectCar(expandedCar);
            setExpandedCar(null);
        }
    }, [expandedCar, onSelectCar]);

    const handleCenterOnUser = useCallback(() => {
        setCenterOnUserTrigger(prev => prev + 1);
        setSelectedCarId(undefined);
    }, []);

    const handleDismissGeoWarning = useCallback(() => {
        setGeoWarningDismissed(true);
    }, []);

    const handleDismissError = useCallback(() => {
        setErrorDismissed(true);
    }, []);

    const showGeoWarning = !geoLoading && geoError && !geoWarningDismissed;
    const showErrorBanner = carsError && hasInitiallyLoaded && !errorDismissed && cars.length === 0;

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

            {/* Animated Hamburger menu button */}
            <button
                onClick={onOpenDrawer}
                className="group absolute top-4 left-4 z-30 w-12 h-12 rounded-full bg-[var(--tg-theme-bg-color)] shadow-lg flex items-center justify-center border border-[var(--tg-theme-hint-color)]/20"
                aria-label="Открыть меню"
                aria-pressed={isDrawerOpen ? 'true' : 'false'}
            >
                <svg className="w-6 h-6 fill-current text-[var(--tg-theme-text-color)] pointer-events-none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                    <rect
                        className="origin-center -translate-y-[5px] translate-x-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-[[aria-pressed=true]]:translate-x-0 group-[[aria-pressed=true]]:translate-y-0 group-[[aria-pressed=true]]:rotate-[315deg]"
                        y="7" width="9" height="2" rx="1"
                    />
                    <rect
                        className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-[[aria-pressed=true]]:rotate-45"
                        y="7" width="16" height="2" rx="1"
                    />
                    <rect
                        className="origin-center translate-y-[5px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-[[aria-pressed=true]]:translate-y-0 group-[[aria-pressed=true]]:rotate-[135deg]"
                        y="7" width="9" height="2" rx="1"
                    />
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
                onCarOpen={handleCarOpen}
                selectedCarId={selectedCarId}
                centerOnUserTrigger={centerOnUserTrigger}
                className="!rounded-none"
            />

            {/* Initial loading */}
            {carsLoading && !hasInitiallyLoaded && cars.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
                    <div className="bg-[var(--tg-theme-bg-color)] rounded-xl p-4 flex items-center gap-3 shadow-xl">
                        <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[var(--tg-theme-text-color)]">Ищем машины...</span>
                    </div>
                </div>
            )}

            {/* Error banner */}
            {showErrorBanner && (
                <div className="absolute top-16 left-4 right-4 z-40">
                    <div className="bg-[var(--tg-theme-bg-color)] border border-red-500/30 rounded-xl p-4 shadow-xl flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--tg-theme-text-color)]">
                                Сервер недоступен
                            </p>
                            <p className="text-xs text-[var(--tg-theme-hint-color)] mt-0.5">
                                {carsLoading
                                    ? 'Пробуем подключиться...'
                                    : `Повторная попытка через ${getRetryDelay(retryCount) / 1000} сек`
                                }
                            </p>
                        </div>
                        <button
                            onClick={handleDismissError}
                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--tg-theme-secondary-bg-color)]"
                        >
                            <svg className="w-4 h-4 text-[var(--tg-theme-hint-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
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
            {cars.length > 0 && !expandedCar && (
                <CarCarousel
                    cars={cars}
                    selectedCarId={selectedCarId}
                    onCarSelect={handleCarSelect}
                    onCarOpen={handleCarOpen}
                    userLatitude={latitude ?? undefined}
                    userLongitude={longitude ?? undefined}
                />
            )}

            {/* Bottom Sheet — expanded car details */}
            <div
                className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-out ${expandedCar ? 'translate-y-0' : 'translate-y-full'
                    }`}
            >
                {expandedCar && (
                    <div className="bg-[var(--tg-theme-bg-color)] rounded-t-3xl shadow-2xl border-t border-[var(--tg-theme-hint-color)]/10">
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 bg-[var(--tg-theme-hint-color)]/40 rounded-full" />
                        </div>

                        {/* Car info */}
                        <div className="px-5 pb-5">
                            {/* Header: name + plate */}
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--tg-theme-text-color)]">
                                        {expandedCar.brand} {expandedCar.model}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm text-[var(--tg-theme-hint-color)]">
                                            {getCarClass(expandedCar)}
                                        </span>
                                        <span className="text-[var(--tg-theme-hint-color)]">•</span>
                                        <span className="px-2 py-0.5 bg-[var(--tg-theme-secondary-bg-color)] rounded text-xs text-[var(--tg-theme-hint-color)] font-mono">
                                            {expandedCar.licensePlate}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseExpanded}
                                    className="w-8 h-8 rounded-full bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-center"
                                >
                                    <svg className="w-4 h-4 text-[var(--tg-theme-hint-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Stats row */}
                            <div className="flex gap-3 mb-4">
                                {/* Fuel */}
                                <div className="flex-1 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-3">
                                    <p className="text-xs text-[var(--tg-theme-hint-color)] mb-1.5">Топливо</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-0.5">
                                            {[...Array(4)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-1.5 h-4 rounded-sm ${i < Math.ceil(expandedCar.fuelLevel / 25)
                                                        ? expandedCar.fuelLevel > 50 ? 'bg-green-500' : expandedCar.fuelLevel > 25 ? 'bg-yellow-500' : 'bg-red-500'
                                                        : 'bg-[var(--tg-theme-hint-color)]/30'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="font-bold text-[var(--tg-theme-text-color)]">{expandedCar.fuelLevel}%</span>
                                    </div>
                                </div>

                                {/* Tariffs preview */}
                                {expandedCar.tariffs.slice(0, 2).map((tariff) => (
                                    <div key={tariff.id} className="flex-1 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-3">
                                        <p className="text-xs text-[var(--tg-theme-hint-color)] mb-1.5">
                                            {tariff.type === 'minute' ? 'В минуту' : tariff.type === 'hourly' ? 'В час' : 'В сутки'}
                                        </p>
                                        <p className="font-bold text-[var(--color-accent)]">
                                            {tariff.pricePerUnit} <span className="text-xs font-normal text-[var(--tg-theme-hint-color)]">₽/{tariff.type === 'minute' ? 'мин' : tariff.type === 'hourly' ? 'час' : 'сут'}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Action button */}
                            <Button fullWidth size="lg" onClick={handleRentCar}>
                                Подробнее
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Backdrop for expanded sheet */}
            {expandedCar && (
                <div
                    className="absolute inset-0 bg-black/30 z-[35] transition-opacity duration-300"
                    onClick={handleCloseExpanded}
                />
            )}
        </div>
    );
});
