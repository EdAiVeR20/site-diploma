import type { Car } from "../types";

interface CarCardProps {
  car: Car;
  onSelect: (car: Car) => void;
  distance?: number;
}

export function CarCard({ car, onSelect, distance }: CarCardProps) {
  const hourlyTariff = car.tariffs.find((t) => t.type === "hourly");
  const priceText = hourlyTariff
    ? `${hourlyTariff.pricePerUnit} ₽`
    : `от ${Math.min(...car.tariffs.map((t) => t.pricePerUnit))} ₽`;

  return (
    <button
      onClick={() => onSelect(car)}
      className="car-list-item w-full text-left touch-manipulation"
    >
      {/* Car Image */}
      <div className="w-16 h-12 rounded-lg bg-[var(--color-surface)] flex items-center justify-center overflow-hidden shrink-0">
        {car.imageUrl ? (
          <img
            src={car.imageUrl}
            alt={`${car.brand} ${car.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            className="w-8 h-8 text-[var(--tg-theme-hint-color)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0l-2-4h12l-2 4M6 13V9a2 2 0 012-2h8a2 2 0 012 2v4"
            />
          </svg>
        )}
      </div>

      {/* Car Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[var(--tg-theme-text-color)] truncate text-base">
          {car.brand} {car.model}
        </h3>
        <div className="flex items-center gap-2 mt-0.5">
          {/* Fuel Level */}
          <div className="flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5 text-[var(--tg-theme-hint-color)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="text-xs text-[var(--tg-theme-hint-color)]">
              {car.fuelLevel}%
            </span>
          </div>
          {/* Distance */}
          {distance !== undefined && (
            <span className="text-xs text-[var(--tg-theme-hint-color)]">
              {distance < 1
                ? `${Math.round(distance * 1000)} м`
                : `${distance.toFixed(1)} км`}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="text-right shrink-0">
        <div className="price-accent text-base">{priceText}</div>
        <div className="price-unit">{hourlyTariff ? "/час" : ""}</div>
      </div>
    </button>
  );
}
