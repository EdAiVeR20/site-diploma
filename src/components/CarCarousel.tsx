import { useRef, useEffect, useCallback, memo } from "react";
import type { Car } from "../types";

interface CarCarouselProps {
  cars: Car[];
  selectedCarId?: string;
  onCarSelect: (car: Car) => void;
  /** Called when user swipes up on the selected card */
  onDragExpand: (car: Car, cardRect: DOMRect, touchY: number) => void;
  userLatitude?: number;
  userLongitude?: number;
}

// Haversine distance
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${Math.round(d * 1000)} м` : `${d.toFixed(1)} км`;
}

function getFuelDisplay(car: Car) {
  const value = car.fuelLevel;
  return {
    label: "Топливо",
    value,
    color:
      value > 50 ? "bg-green-500" : value > 25 ? "bg-yellow-500" : "bg-red-500",
  };
}

function getCarClass(_car: Car): string {
  const tariff = _car.tariffs.find((t) => t.type === "hourly");
  if (!tariff) return "Стандарт";
  if (tariff.pricePerUnit >= 1000) return "Премиум";
  if (tariff.pricePerUnit >= 600) return "Бизнес";
  if (tariff.pricePerUnit >= 400) return "Comfort";
  return "Эконом";
}

function getBestPrice(car: Car): { price: string; unit: string } {
  if (!car.tariffs || car.tariffs.length === 0) return { price: "—", unit: "" };
  const minuteTariff = car.tariffs.find((t) => t.type === "minute");
  if (minuteTariff)
    return { price: `${minuteTariff.pricePerUnit}`, unit: "₽/мин" };
  const hourlyTariff = car.tariffs.find((t) => t.type === "hourly");
  if (hourlyTariff)
    return { price: `${hourlyTariff.pricePerUnit}`, unit: "₽/час" };
  return { price: "—", unit: "" };
}

function CarCarouselInner({
  cars,
  selectedCarId,
  onCarSelect,
  onDragExpand,
  userLatitude,
  userLongitude,
}: CarCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Vertical drag detection
  const touchStartRef = useRef<{ x: number; y: number; car: Car } | null>(null);
  const hasDragTriggered = useRef(false);
  // Track whether auto-scroll should happen (only on user-initiated selection)
  const pendingScrollRef = useRef(false);
  const prevSelectedCarIdRef = useRef<string | undefined>(selectedCarId);

  const setCardRef = useCallback((el: HTMLDivElement | null, carId: string) => {
    if (el) cardRefs.current.set(carId, el);
    else cardRefs.current.delete(carId);
  }, []);

  // Tap → select only (no click-to-open)
  const handleTap = useCallback(
    (car: Car) => {
      if (hasDragTriggered.current) return;
      if (car.id !== selectedCarId) {
        onCarSelect(car);
      }
      // Tapping an already-selected card does nothing — swipe up to expand
    },
    [selectedCarId, onCarSelect],
  );

  // Touch: detect vertical upward drag on selected card
  const handleCardTouchStart = useCallback(
    (e: React.TouchEvent, car: Car) => {
      if (car.id !== selectedCarId) return;
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, car };
      hasDragTriggered.current = false;
    },
    [selectedCarId],
  );

  const handleCardTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current || hasDragTriggered.current) return;
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = touchStartRef.current.y - touch.clientY; // positive = upward

      // Vertical upward > 8px and clearly vertical (not horizontal scroll)
      if (deltaY > 8 && deltaY > deltaX * 1.2) {
        hasDragTriggered.current = true;
        const car = touchStartRef.current.car;
        const cardEl = cardRefs.current.get(car.id);
        const rect = cardEl?.getBoundingClientRect();
        if (rect) {
          e.preventDefault();
          onDragExpand(car, rect, touchStartRef.current.y);
        }
        touchStartRef.current = null;
      }
    },
    [onDragExpand],
  );

  const handleCardTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    setTimeout(() => {
      hasDragTriggered.current = false;
    }, 50);
  }, []);

  // Auto-scroll to selected card — only when selectedCarId actually changes,
  // NOT on background data refetches that produce a new `cars` array reference.
  useEffect(() => {
    if (
      selectedCarId === prevSelectedCarIdRef.current &&
      !pendingScrollRef.current
    )
      return;
    prevSelectedCarIdRef.current = selectedCarId;
    pendingScrollRef.current = false;
    if (!selectedCarId || !scrollRef.current) return;
    const idx = cars.findIndex((c) => c.id === selectedCarId);
    if (idx === -1) return;
    const container = scrollRef.current;
    const cardWidth = 280;
    const gap = 16;
    const containerWidth = container.clientWidth;
    const scrollTarget =
      idx * (cardWidth + gap) - (containerWidth / 2 - cardWidth / 2);
    container.scrollTo({ left: scrollTarget, behavior: "smooth" });
  }, [selectedCarId, cars]);

  if (cars.length === 0) return null;

  return (
    <div className="absolute bottom-6 left-0 right-0 z-30">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{
          paddingLeft: "calc(50vw - 140px)",
          paddingRight: "calc(50vw - 140px)",
        }}
      >
        {cars.map((car) => {
          const isSelected = car.id === selectedCarId;
          const fuel = getFuelDisplay(car);
          const carClass = getCarClass(car);
          const { price, unit } = getBestPrice(car);
          const distance =
            userLatitude && userLongitude
              ? calculateDistance(
                  userLatitude,
                  userLongitude,
                  car.latitude,
                  car.longitude,
                )
              : null;

          return (
            <div
              key={car.id}
              ref={(el) => setCardRef(el, car.id)}
              onClick={() => handleTap(car)}
              onTouchStart={(e) => handleCardTouchStart(e, car)}
              onTouchMove={handleCardTouchMove}
              onTouchEnd={handleCardTouchEnd}
              className={`flex-shrink-0 w-[280px] bg-[var(--tg-theme-bg-color)] rounded-2xl shadow-xl overflow-hidden snap-center cursor-pointer transition-all duration-200 border-2 ${
                isSelected
                  ? "border-[var(--color-accent)] scale-[1.02]"
                  : "border-transparent"
              }`}
            >
              <div className="px-5 pt-4 pb-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <svg
                    className="w-3.5 h-3.5 text-[var(--color-accent)]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-xs font-medium text-[var(--color-accent)]">
                    {car.fuelType || "Бензин"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 mb-1">
                  <h3 className="font-bold text-xl leading-tight text-[var(--tg-theme-text-color)] truncate min-w-0">
                    {car.brand} {car.model}
                  </h3>
                  <span className="flex-shrink-0 px-2 py-0.5 bg-[var(--tg-theme-secondary-bg-color)] rounded-md text-[11px] text-[var(--tg-theme-text-color)] font-mono border border-[var(--tg-theme-hint-color)]/20">
                    {car.licensePlate}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-[var(--tg-theme-hint-color)] mb-3">
                  <span>{carClass}</span>
                  {distance && (
                    <>
                      <span>•</span>
                      <span>{distance}</span>
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-3.5">
                    <p className="text-xs text-[var(--tg-theme-hint-color)] mb-2">
                      {fuel.label}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-[3px]">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-[5px] h-[18px] rounded-sm ${i < Math.ceil(fuel.value / 25) ? fuel.color : "bg-[var(--tg-theme-hint-color)]/25"}`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-lg text-[var(--tg-theme-text-color)]">
                        {fuel.value}%
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-3.5">
                    <p className="text-xs text-[var(--tg-theme-hint-color)] mb-2">
                      Цена
                    </p>
                    <p className="font-bold text-lg text-[var(--tg-theme-text-color)]">
                      <span className="text-[var(--color-accent)]">
                        {price}
                      </span>
                      <span className="text-xs font-normal text-[var(--tg-theme-hint-color)]">
                        {" "}
                        {unit}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-32 bg-gradient-to-t from-[var(--tg-theme-secondary-bg-color)]/50 to-transparent flex items-center justify-center px-8">
                {car.imageUrl ? (
                  <img
                    src={car.imageUrl}
                    alt={`${car.brand} ${car.model}`}
                    className="h-full w-full object-contain drop-shadow-lg"
                  />
                ) : (
                  <svg
                    className="w-20 h-20 text-[var(--tg-theme-hint-color)]/30"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={0.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0l-2-4h12l-2 4M6 13V9a2 2 0 012-2h8a2 2 0 012 2v4"
                    />
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
