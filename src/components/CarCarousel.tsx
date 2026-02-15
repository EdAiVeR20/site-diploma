import { useRef, useEffect, useCallback, memo } from 'react';
import type { Car } from '../types';

interface CarCarouselProps {
    cars: Car[];
    selectedCarId?: string;
    onCarSelect: (car: Car) => void;
    onCarDoubleTap: (car: Car) => void;
    userLatitude?: number;
    userLongitude?: number;
}

// Haversine distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): string {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d < 1 ? `${Math.round(d * 1000)} м` : `${d.toFixed(1)} км`;
}

function getFuelDisplay(car: Car) {
    const value = car.fuelLevel;
    return {
        label: 'Топливо',
        value,
        color: value > 50 ? 'bg-green-500' : value > 25 ? 'bg-yellow-500' : 'bg-red-500',
    };
}

function getCarClass(_car: Car): string {
    // Car type doesn't have carClass field - derive from tariff price
    const tariff = _car.tariffs.find(t => t.type === 'hourly');
    if (!tariff) return 'Стандарт';
    if (tariff.pricePerUnit >= 1000) return 'Премиум';
    if (tariff.pricePerUnit >= 600) return 'Бизнес';
    if (tariff.pricePerUnit >= 400) return 'Comfort';
    return 'Эконом';
}

function getHourlyPrice(car: Car): string {
    const tariff = car.tariffs.find(t => t.type === 'hourly');
    return tariff ? `${tariff.pricePerUnit}` : '—';
}

function CarCarouselInner({
    cars,
    selectedCarId,
    onCarSelect,
    onCarDoubleTap,
    userLatitude,
    userLongitude,
}: CarCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const lastTapRef = useRef<{ id: string; time: number } | null>(null);

    // Handle single/double tap
    const handleTap = useCallback((car: Car) => {
        const now = Date.now();
        const lastTap = lastTapRef.current;

        if (lastTap && lastTap.id === car.id && now - lastTap.time < 400) {
            // Double tap — open rental
            onCarDoubleTap(car);
            lastTapRef.current = null;
        } else {
            // Single tap — select
            onCarSelect(car);
            lastTapRef.current = { id: car.id, time: now };
        }
    }, [onCarSelect, onCarDoubleTap]);

    // Scroll to selected card
    useEffect(() => {
        if (!selectedCarId || !scrollRef.current) return;
        const idx = cars.findIndex(c => c.id === selectedCarId);
        if (idx === -1) return;

        const container = scrollRef.current;
        const cardWidth = 280;
        const gap = 16;
        const containerWidth = container.clientWidth;
        const scrollTarget = idx * (cardWidth + gap) - (containerWidth / 2 - cardWidth / 2);

        container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    }, [selectedCarId, cars]);

    if (cars.length === 0) return null;

    return (
        <div className="absolute bottom-6 left-0 right-0 z-30">
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
                style={{ paddingLeft: 'calc(50vw - 140px)', paddingRight: 'calc(50vw - 140px)' }}
            >
                {cars.map((car) => {
                    const isSelected = car.id === selectedCarId;
                    const fuel = getFuelDisplay(car);
                    const carClass = getCarClass(car);
                    const price = getHourlyPrice(car);
                    const distance = userLatitude && userLongitude
                        ? calculateDistance(userLatitude, userLongitude, car.latitude, car.longitude)
                        : null;

                    return (
                        <div
                            key={car.id}
                            onClick={() => handleTap(car)}
                            className={`flex-shrink-0 w-[280px] bg-[var(--tg-theme-bg-color)] rounded-2xl shadow-xl overflow-hidden snap-center cursor-pointer transition-all duration-200 border-2 ${isSelected
                                ? 'border-[var(--color-accent)] scale-[1.02]'
                                : 'border-transparent'
                                }`}
                        >
                            {/* Top section: Type badge + Name + Class */}
                            <div className="p-5 pb-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)]">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Бензин
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-xl text-[var(--tg-theme-text-color)]">
                                        {car.brand} {car.model}
                                    </h3>
                                    <span className="px-2.5 py-1 bg-[var(--tg-theme-secondary-bg-color)] rounded-lg text-xs text-[var(--tg-theme-text-color)] font-mono border border-[var(--tg-theme-hint-color)]/15">
                                        {car.licensePlate}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-[var(--tg-theme-hint-color)]">{carClass}</span>
                                    {distance && (
                                        <>
                                            <span className="text-[var(--tg-theme-hint-color)]">•</span>
                                            <span className="text-sm text-[var(--tg-theme-hint-color)]">{distance}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Stats: Battery/Fuel + Price */}
                            <div className="flex px-5 pb-4 gap-3">
                                <div className="flex-1 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl p-4">
                                    <p className="text-xs text-[var(--tg-theme-hint-color)] mb-2">{fuel.label}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-0.5">
                                            {[...Array(4)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-2 h-5 rounded-sm ${i < Math.ceil(fuel.value / 25) ? fuel.color : 'bg-[var(--tg-theme-hint-color)]/30'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="font-bold text-lg text-[var(--tg-theme-text-color)]">{fuel.value}%</span>
                                    </div>
                                </div>

                                <div className="flex-1 bg-[var(--tg-theme-secondary-bg-color)] rounded-2xl p-4">
                                    <p className="text-xs text-[var(--tg-theme-hint-color)] mb-2">Цена</p>
                                    <p className="font-bold text-lg text-[var(--tg-theme-text-color)]">
                                        <span className="text-[var(--color-accent)]">{price}</span>
                                        <span className="text-xs font-normal text-[var(--tg-theme-hint-color)]"> ₽/час</span>
                                    </p>
                                </div>
                            </div>

                            {/* Car image */}
                            <div className="h-36 bg-gradient-to-t from-[var(--tg-theme-secondary-bg-color)] to-transparent flex items-center justify-center px-4">
                                {car.imageUrl ? (
                                    <img
                                        src={car.imageUrl}
                                        alt={`${car.brand} ${car.model}`}
                                        className="h-full w-full object-contain"
                                    />
                                ) : (
                                    <svg className="w-24 h-24 text-[var(--tg-theme-hint-color)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0l-2-4h12l-2 4M6 13V9a2 2 0 012-2h8a2 2 0 012 2v4" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export const CarCarousel = memo(CarCarouselInner);
