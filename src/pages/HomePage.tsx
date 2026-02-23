import { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { YandexMap, LocationButton, CarCarousel, Button } from '../components';
import { Drawer } from '@lobehub/ui';
import { useAppDispatch, useAppSelector } from '../store';
import { selectTariff, clearSelectedTariff } from '../store/slices/rentalsSlice';
import { useTelegram } from '../hooks/useTelegram';
import { useAvailableCars } from '../hooks/queries/useCars';
import { useCreateRental } from '../hooks/queries/useRentals';
import type { Car, Tariff } from '../types';
import toast from 'react-hot-toast';

// --- Custom Collapsible Toast ---
const CollapsibleToast = ({
    title,
    description,
    icon,
    pulse = false
}: {
    title: string,
    description?: string,
    icon: React.ReactNode,
    pulse?: boolean
}) => {
    const [minimized, setMinimized] = useState(true);

    return (
        <div
            className={`relative overflow-hidden flex items-center rounded-full text-[var(--tg-theme-text-color)] transition-all duration-500 ease-in-out cursor-pointer pointer-events-auto bg-[var(--tg-theme-bg-color)] shadow-lg border border-[var(--tg-theme-hint-color)]/20 ${minimized ? 'w-12 h-12 p-0 justify-center' : 'w-auto max-w-[calc(100vw-32px)] min-h-[48px] px-2 pr-5 py-2 gap-2.5'}`}
            onClick={() => setMinimized((prev) => !prev)}
            style={{ transform: 'translateZ(0)' }} // Hardware acceleration for smooth transition
        >
            <div className={`flex-shrink-0 flex items-center justify-center ${minimized ? 'w-12 h-12' : 'w-8 h-8 pl-1.5'} ${pulse && minimized ? 'animate-pulse' : ''} transition-all duration-500`}>
                {icon}
            </div>

            <div className={`transition-all duration-400 overflow-hidden flex items-center justify-between whitespace-nowrap ${minimized ? 'w-0 opacity-0' : 'opacity-100 flex-1'}`}>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium pr-1 truncate">{title}</span>
                    {description && <span className="text-[11px] text-[var(--tg-theme-hint-color)] truncate leading-tight mt-0.5">{description}</span>}
                </div>
            </div>
        </div>
    );
};
// --------------------------------

interface HomePageProps {
    onOpenDrawer: () => void;
    isActive?: boolean;
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

export const HomePage = memo(function HomePage({ onOpenDrawer, isActive = true }: HomePageProps) {
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
    const [selectedCarId, setSelectedCarId] = useState<string | undefined>();
    const [centerOnUserTrigger, setCenterOnUserTrigger] = useState(0);

    // Drawer state
    const [expandedCar, setExpandedCar] = useState<Car | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // ─── Unified Status Toast ───
    useEffect(() => {
        let toastProps: { title: string; description?: string; icon: React.ReactNode; pulse?: boolean; } | null = null;

        // Priority 1: Server Error
        if (hasCarsError && cars.length === 0) {
            toastProps = {
                title: "Сервер недоступен",
                description: isCarsFetching ? 'Автопереподключение...' : 'Ожидание сети...',
                icon: isCarsFetching ? (
                    <div className="w-5 h-5 border-[2.5px] border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                ) : (
                    <svg className="w-6 h-6 text-red-500 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                ),
                pulse: !isCarsFetching,
            };
        }
        // Priority 2: Geolocation Loading
        else if (geoLoading) {
            toastProps = {
                title: "Определяем местоположение",
                description: undefined,
                icon: <div className="w-5 h-5 border-[2.5px] border-blue-500 border-t-transparent rounded-full animate-spin" />,
            };
        }
        // Priority 3: Geolocation Warning
        else if (!geoLoading && geoError) {
            toastProps = {
                title: "Включите геолокацию",
                description: "Для точного определения машин",
                icon: (
                    <svg className="w-6 h-6 text-amber-500 drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                )
            };
        }
        // Priority 4: Cars Loading
        else if (carsLoading && cars.length === 0) {
            toastProps = {
                title: "Ищем машины...",
                description: undefined,
                icon: <div className="w-5 h-5 border-[2.5px] border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />,
            };
        }

        if (!isActive) {
            // Remove instantly without animation when switching screens
            toast.remove('global-status');
            return;
        }

        if (toastProps) {
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} pointer-events-none mt-1 mr-1`}>
                    <CollapsibleToast
                        title={toastProps.title}
                        description={toastProps.description}
                        icon={toastProps.icon}
                        pulse={toastProps.pulse}
                    />
                </div>
            ), {
                id: 'global-status',
                duration: Infinity,
            });
        } else {
            // Dismiss gracefully with animation when content is loaded
            toast.dismiss('global-status');
        }
    }, [hasCarsError, cars.length, isCarsFetching, geoLoading, geoError, carsLoading, isActive]);

    // Cleanup toasts when unmounting HomePage (e.g., navigating to Profile)
    useEffect(() => {
        return () => {
            toast.remove('global-status');
        };
    }, []);

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


    const userLocation = useMemo(
        () => latitude && longitude ? { latitude, longitude } : undefined,
        [latitude, longitude]
    );

    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* Geo loading indicator removed and merged into unified toast system */}

            {/* Hamburger menu */}
            <button
                onClick={onOpenDrawer}
                className="absolute top-4 left-4 z-[40] w-12 h-12 rounded-full bg-[var(--tg-theme-bg-color)] shadow-lg flex items-center justify-center border border-[var(--tg-theme-hint-color)]/20 active:scale-95 transition-transform"
                aria-label="Открыть меню"
            >
                <svg className="w-6 h-6 text-[var(--tg-theme-text-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Location button */}
            <div className="absolute top-1/2 right-4 z-[40] transform -translate-y-1/2">
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
