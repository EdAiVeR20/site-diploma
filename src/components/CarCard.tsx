import type { Car } from '../types';

interface CarCardProps {
    car: Car;
    onSelect: (car: Car) => void;
    distance?: number;
}

export function CarCard({ car, onSelect, distance }: CarCardProps) {
    const minPrice = Math.min(...car.tariffs.map(t => t.pricePerUnit));
    const hourlyTariff = car.tariffs.find(t => t.type === 'hourly');

    return (
        <button
            onClick={() => onSelect(car)}
            className="flex items-center gap-3 p-3 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl w-full text-left touch-manipulation active:scale-[0.98] transition-transform"
        >
            {/* Car Image */}
            <div className="w-20 h-14 rounded-lg bg-[var(--tg-theme-bg-color)] flex items-center justify-center overflow-hidden shrink-0">
                {car.imageUrl ? (
                    <img src={car.imageUrl} alt={`${car.brand} ${car.model}`} className="w-full h-full object-cover" />
                ) : (
                    <svg className="w-10 h-10 text-[var(--tg-theme-hint-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0l-2-4h12l-2 4M6 13V9a2 2 0 012-2h8a2 2 0 012 2v4" />
                    </svg>
                )}
            </div>

            {/* Car Info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--tg-theme-text-color)] truncate">
                    {car.brand} {car.model}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                    {/* Fuel Level */}
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-[var(--tg-theme-hint-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-xs text-[var(--tg-theme-hint-color)]">{car.fuelLevel}%</span>
                    </div>
                    {/* Distance */}
                    {distance !== undefined && (
                        <span className="text-xs text-[var(--tg-theme-hint-color)]">
                            {distance < 1 ? `${Math.round(distance * 1000)} м` : `${distance.toFixed(1)} км`}
                        </span>
                    )}
                </div>
            </div>

            {/* Price */}
            <div className="text-right shrink-0">
                <div className="font-bold text-[var(--tg-theme-button-color)]">
                    {hourlyTariff ? `${hourlyTariff.pricePerUnit} ₽` : `от ${minPrice} ₽`}
                </div>
                <div className="text-xs text-[var(--tg-theme-hint-color)]">
                    {hourlyTariff ? '/час' : ''}
                </div>
            </div>
        </button>
    );
}
