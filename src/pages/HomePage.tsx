import { useState, useCallback, memo, useMemo } from 'react';
import { YandexMap, LocationButton, CarCarousel, Button } from '../components';
import { Drawer } from '@lobehub/ui';
import { useAppDispatch, useAppSelector } from '../store';
import { selectTariff, clearSelectedTariff } from '../store/slices/rentalsSlice';
import { useTelegram } from '../hooks/useTelegram';
import { useAvailableCars } from '../hooks/queries/useCars';
import { useCreateRental } from '../hooks/queries/useRentals';
import type { Car, Tariff } from '../types';

interface HomePageProps {
    onOpenDrawer: () => void;
}

/** Retry delays: handled internally by React Query */

const getTariffTitle = (type: 'hourly' | 'daily' | 'minute') => {
    const titles = { minute: 'В минуту', hourly: 'В час', daily: 'В сутки' };
    return titles[type] || type;
};

const getTariffDescription = (type: 'hourly' | 'daily' | 'minute') => {
    const desc = { minute: 'Для коротких поездок', hourly: 'На несколько часов', daily: 'Для длительных поездок' };
    return desc[type] || '';
};

function getFuelDisplayHP(car: Car) {
    const value = car.fuelLevel;
    return {
        value,
        color: value > 50 ? 'bg-green-500' : value > 25 ? 'bg-yellow-500' : 'bg-red-500',
    };
}





interface ExpandedCarDetailsProps {
    car: Car;
    selectedTariff: Tariff | null;
    isCreating: boolean;
    onTariffSelect: (tariff: Tariff) => void;
    onRent: () => void;
    onClose: () => void;
}

const ExpandedCarDetails = memo(function ExpandedCarDetails({
    car,
    selectedTariff,
    isCreating,
    onTariffSelect,
    onRent,
    onClose
}: ExpandedCarDetailsProps) {
    const fuel = getFuelDisplayHP(car);
    const fuelBarCount = Math.ceil(car.fuelLevel / 25);

    return (
        <div className="flex flex-col min-h-full px-5 pb-28 pt-14 bg-[var(--tg-theme-bg-color)]">
            {/* Title row */}
            <div className="flex items-start justify-between gap-3 mt-2">
                <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color)] leading-tight">
                    {car.brand} {car.model}
                </h1>
                <div className="flex items-center gap-3 flex-shrink-0 pt-1">
                    <div className="flex items-center gap-1.5">
                        <div className="flex gap-[3px]">
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-[5px] h-4 rounded-sm ${i < fuelBarCount ? fuel.color : 'bg-[var(--tg-theme-hint-color)]/25'}`}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-[var(--tg-theme-text-color)] font-medium">{car.fuelLevel}%</span>
                    </div>
                </div>
            </div>

            {/* Absolute Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]/70 active:scale-95 transition-transform z-10"
                aria-label="Close"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* License plate */}
            <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-[var(--tg-theme-secondary-bg-color)] rounded-md text-xs text-[var(--tg-theme-hint-color)] font-mono border border-[var(--tg-theme-hint-color)]/15 w-fit">
                {car.licensePlate}
            </span>

            {/* Car Image */}
            <div className="relative h-48 flex items-center justify-center px-6 my-4">
                {car.imageUrl ? (
                    <img
                        src={car.imageUrl}
                        alt={`${car.brand} ${car.model}`}
                        className="h-full w-full object-contain drop-shadow-xl"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-24 h-24 text-[var(--tg-theme-hint-color)]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0l-2-4h12l-2 4M6 13V9a2 2 0 012-2h8a2 2 0 012 2v4" />
                        </svg>
                    </div>
                )}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-8 border-b-2 border-[var(--tg-theme-hint-color)]/15 rounded-b-full" />
            </div>

            {/* Tariffs */}
            <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-3">
                Тарифы
            </h2>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5" style={{ transform: 'translateZ(0)' }}>
                {car.tariffs.map((tariff) => {
                    const isSelected = selectedTariff?.id === tariff.id;
                    return (
                        <button
                            key={tariff.id}
                            onClick={() => onTariffSelect(tariff)}
                            className={`flex-shrink-0 w-36 rounded-2xl overflow-hidden transition-all text-left active:scale-95 ${isSelected
                                ? 'border-2 border-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/10'
                                : 'border-2 border-transparent bg-[var(--tg-theme-secondary-bg-color)]'
                                }`}
                        >
                            <div className="px-4 pt-3.5 pb-2.5">
                                <p className="text-sm font-semibold text-[var(--tg-theme-text-color)] mb-0.5">
                                    {getTariffTitle(tariff.type)}
                                </p>
                                <p className="text-[11px] text-[var(--tg-theme-hint-color)] mb-2.5 leading-snug">
                                    {getTariffDescription(tariff.type)}
                                </p>
                                <p className={`text-xl font-bold ${isSelected ? 'text-[var(--color-accent)]' : 'price-accent'}`}>
                                    {tariff.pricePerUnit} ₽
                                </p>
                                <p className="text-xs text-[var(--tg-theme-hint-color)] mt-0.5">
                                    /{tariff.type === 'hourly' ? 'час' : tariff.type === 'daily' ? 'сутки' : 'мин'}
                                </p>
                            </div>
                            <div className={`h-1 ${isSelected
                                ? 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)]'
                                : 'bg-gradient-to-r from-[var(--tg-theme-hint-color)]/20 to-[var(--tg-theme-hint-color)]/5'
                                }`} />
                        </button>
                    );
                })}
            </div>

            {/* Rent button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--tg-theme-bg-color)] border-t border-[var(--color-accent)]/10 safe-area-bottom z-[60]">
                <Button
                    fullWidth
                    size="lg"
                    onClick={onRent}
                    loading={isCreating}
                    disabled={!selectedTariff}
                >
                    Арендовать
                </Button>
            </div>
        </div>
    );
});

export const HomePage = memo(function HomePage({ onOpenDrawer }: HomePageProps) {
    const dispatch = useAppDispatch();
    const { geolocation } = useAppSelector((state) => state.ui);
    const { selectedTariff } = useAppSelector((state) => state.rentals);
    const { latitude, longitude, isLoading: geoLoading, error: geoError } = geolocation;
    const { hapticFeedback, showAlert, showConfirm } = useTelegram();

    // Mutations
    const { mutateAsync: createRental, isPending: isCreating } = useCreateRental();

    // React Query for Cars
    const {
        data: cars = [],
        isLoading: carsLoading,
        isError: hasCarsError,
        isFetching: isCarsFetching,
    } = useAvailableCars({
        lat: latitude ?? undefined,
        lon: longitude ?? undefined,
        radius: 5,
    });

    // Local state
    const [geoWarningDismissed, setGeoWarningDismissed] = useState(false);
    const [selectedCarId, setSelectedCarId] = useState<string | undefined>();
    const [centerOnUserTrigger, setCenterOnUserTrigger] = useState(0);
    const [errorDismissed, setErrorDismissed] = useState(false);

    // Drawer state
    const [expandedCar, setExpandedCar] = useState<Car | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // ─── Handlers ───

    const handleCarSelect = useCallback((car: Car) => {
        setSelectedCarId(car.id);
        // Pre-select first tariff so it's ready when card expands
        if (car.tariffs.length > 0) {
            dispatch(selectTariff(car.tariffs[0]));
        }
    }, [dispatch]);

    // Called by CarCarousel when vertical drag is detected on selected card
    const handleDragExpand = useCallback((car: Car) => {
        setExpandedCar(car);
        setIsDrawerOpen(true);
        if (car.tariffs.length > 0) {
            dispatch(selectTariff(car.tariffs[0]));
        }
        hapticFeedback('light');
    }, [dispatch, hapticFeedback]);

    // Map marker tap
    const handleMapCarOpen = useCallback((car: Car) => {
        setExpandedCar(car);
        setIsDrawerOpen(true);
        setSelectedCarId(car.id);
        if (car.tariffs.length > 0) {
            dispatch(selectTariff(car.tariffs[0]));
        }
        hapticFeedback('light');
    }, [dispatch, hapticFeedback]);

    const handleCardCollapse = useCallback(() => {
        setIsDrawerOpen(false);
        // Delay clearing car data to allow exit animation to play smoothly
        setTimeout(() => {
            setExpandedCar(null);
            dispatch(clearSelectedTariff());
        }, 300);
    }, [dispatch]);

    const handleTariffSelect = useCallback((tariff: Tariff) => {
        dispatch(selectTariff(tariff));
        hapticFeedback('light');
    }, [dispatch, hapticFeedback]);

    const handleRent = useCallback(async () => {
        if (!expandedCar || !selectedTariff) {
            await showAlert('Выберите тариф');
            return;
        }

        const confirmed = await showConfirm(
            `Арендовать ${expandedCar.brand} ${expandedCar.model} по тарифу "${selectedTariff.name}" (${selectedTariff.pricePerUnit} ₽/${selectedTariff.type === 'hourly' ? 'час' : selectedTariff.type === 'daily' ? 'сутки' : 'мин'})?`
        );
        if (!confirmed) return;

        try {
            hapticFeedback('medium');
            await createRental({
                carId: expandedCar.id,
                tariffId: selectedTariff.id,
            });

            hapticFeedback('success');
            await showAlert('Аренда успешно оформлена!');
            handleCardCollapse();
        } catch {
            hapticFeedback('error');
            await showAlert('Не удалось оформить аренду. Попробуйте позже.');
        }
    }, [expandedCar, selectedTariff, createRental, hapticFeedback, showAlert, showConfirm, handleCardCollapse]);

    const handleCenterOnUser = useCallback(() => {
        setCenterOnUserTrigger(prev => prev + 1);
        setSelectedCarId(undefined);
    }, []);

    const handleDismissGeoWarning = useCallback(() => setGeoWarningDismissed(true), []);
    const handleDismissError = useCallback(() => setErrorDismissed(true), []);

    const showGeoWarning = !geoLoading && geoError && !geoWarningDismissed;
    const showErrorBanner = hasCarsError && !errorDismissed && cars.length === 0;

    const userLocation = useMemo(
        () => latitude && longitude ? { latitude, longitude } : undefined,
        [latitude, longitude]
    );

    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* Geolocation Warning */}
            {showGeoWarning && (
                <div className="absolute top-4 left-4 right-4 z-40 animate-slide-up">
                    <div className="glass rounded-2xl p-3.5 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <p className="text-sm text-[var(--tg-theme-text-color)] flex-1">
                            Включите геолокацию для точного определения машин
                        </p>
                        <button
                            onClick={handleDismissGeoWarning}
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
                        >
                            <svg className="w-4 h-4 text-[var(--tg-theme-hint-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Hamburger menu */}
            <button
                onClick={onOpenDrawer}
                className="absolute top-4 left-4 z-30 w-12 h-12 rounded-full bg-[var(--tg-theme-bg-color)] shadow-lg flex items-center justify-center border border-[var(--tg-theme-hint-color)]/20 active:scale-95 transition-transform"
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

            {/* Map */}
            <YandexMap
                cars={cars}
                userLocation={userLocation}
                onCarSelect={handleCarSelect}
                onCarOpen={handleMapCarOpen}
                selectedCarId={selectedCarId}
                centerOnUserTrigger={centerOnUserTrigger}
                className="!rounded-none"
            />

            {/* Loading */}
            {carsLoading && cars.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
                    <div className="glass rounded-2xl p-5 flex flex-col items-center gap-3 shadow-xl">
                        <div className="w-8 h-8 border-3 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-[var(--tg-theme-text-color)]">Ищем машины...</span>
                    </div>
                </div>
            )}

            {/* Server error */}
            {showErrorBanner && (
                <div className="absolute inset-0 flex items-center justify-center z-20 px-8">
                    <div className="glass rounded-3xl p-8 flex flex-col items-center text-center max-w-xs animate-slide-up">
                        <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-red-400 animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-1">
                            Сервер недоступен
                        </h3>
                        <p className="text-sm text-[var(--tg-theme-hint-color)] mb-4">
                            {isCarsFetching
                                ? 'Пробуем подключиться...'
                                : 'Ожидание сети...'
                            }
                        </p>
                        {isCarsFetching && (
                            <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                        )}
                        <button
                            onClick={handleDismissError}
                            className="mt-3 text-xs text-[var(--tg-theme-hint-color)] underline"
                        >
                            Скрыть
                        </button>
                    </div>
                </div>
            )}

            {/* Geo loading */}
            {geoLoading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 glass px-4 py-2 rounded-full flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-[var(--tg-theme-hint-color)]">Определяем...</span>
                </div>
            )}

            {/* Car Carousel */}
            {cars.length > 0 && (
                <CarCarousel
                    cars={cars}
                    selectedCarId={selectedCarId}
                    onCarSelect={handleCarSelect}
                    onDragExpand={handleDragExpand}
                    userLatitude={latitude ?? undefined}
                    userLongitude={longitude ?? undefined}
                />
            )}

            {/* Drawer for car details */}
            <Drawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                placement="bottom"
                height="90vh"
                styles={{
                    body: { padding: 0, backgroundColor: 'var(--tg-theme-bg-color)' },
                    header: { display: 'none' }
                }}
            >
                {expandedCar && (
                    <ExpandedCarDetails
                        car={expandedCar}
                        selectedTariff={selectedTariff}
                        isCreating={isCreating}
                        onTariffSelect={handleTariffSelect}
                        onRent={handleRent}
                        onClose={() => setIsDrawerOpen(false)}
                    />
                )}
            </Drawer>
        </div>
    );
});
