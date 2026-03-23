import { useEffect } from "react";
import { Button } from "../components";
import { useTelegram } from "../hooks/useTelegram";
import { useAppDispatch, useAppSelector } from "../store";
import {
  selectTariff,
  clearSelectedTariff,
} from "../store/slices/rentalsSlice";
import { useCreateRental } from "../hooks/queries/useRentals";
import type { Car, Tariff } from "../types";

interface RentalPageProps {
  car: Car;
  onClose: () => void;
  onSuccess: () => void;
}

export function RentalPage({ car, onClose, onSuccess }: RentalPageProps) {
  const dispatch = useAppDispatch();
  const {
    showBackButton,
    hideBackButton,
    hapticFeedback,
    showAlert,
    showConfirm,
  } = useTelegram();
  const { selectedTariff } = useAppSelector((state) => state.rentals);
  const { mutateAsync: createRentalMutate, isPending: isCreating } =
    useCreateRental();

  // Initialize selected tariff
  useEffect(() => {
    if (car.tariffs.length > 0 && !selectedTariff) {
      dispatch(selectTariff(car.tariffs[0]));
    }
  }, [car.tariffs, selectedTariff, dispatch]);

  // Show back button
  useEffect(() => {
    showBackButton(onClose);
    return () => {
      hideBackButton();
      dispatch(clearSelectedTariff());
    };
  }, [onClose, showBackButton, hideBackButton, dispatch]);

  const handleTariffSelect = (tariff: Tariff) => {
    dispatch(selectTariff(tariff));
    hapticFeedback("light");
  };

  const handleRent = async () => {
    if (!selectedTariff) {
      await showAlert("Выберите тариф");
      return;
    }

    const confirmed = await showConfirm(
      `Арендовать ${car.brand} ${car.model} по тарифу "${selectedTariff.name}" (${selectedTariff.pricePerUnit} ₽/${selectedTariff.type === "hourly" ? "час" : selectedTariff.type === "daily" ? "сутки" : "мин"})?`,
    );

    if (!confirmed) return;

    try {
      hapticFeedback("medium");
      await createRentalMutate({
        carId: car.id,
        tariffId: selectedTariff.id,
      });

      hapticFeedback("success");
      await showAlert("Аренда успешно оформлена!");
      onSuccess();
    } catch (err) {
      hapticFeedback("error");
      await showAlert("Не удалось оформить аренду. Попробуйте позже.");
      console.error(err);
    }
  };

  const getTariffDescription = (type: "hourly" | "daily" | "minute") => {
    const descriptions = {
      minute: "Для коротких поездок",
      hourly: "Для поездок на несколько часов",
      daily: "Для длительных поездок",
    };
    return descriptions[type] || "";
  };

  const getTariffTitle = (type: "hourly" | "daily" | "minute") => {
    const titles = {
      minute: "В минуту",
      hourly: "В час",
      daily: "В сутки",
    };
    return titles[type] || type;
  };

  const fuelBarCount = Math.ceil(car.fuelLevel / 25);
  const fuelColor = car.fuelLevel > 25 ? "bg-green-500" : "bg-red-500";

  return (
    <div className="flex flex-col min-h-full bg-[var(--tg-theme-bg-color)] overflow-x-hidden">
      {/* Header: Back button */}
      <div className="px-5 pt-4 pb-2">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-center"
        >
          <svg
            className="w-5 h-5 text-[var(--tg-theme-text-color)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Title row: Name + Battery indicator */}
      <div className="px-5 pt-2 pb-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color)] leading-tight">
            {car.brand} {car.model}
          </h1>
          <div className="flex items-center gap-1.5 flex-shrink-0 pt-1">
            <div className="flex gap-[3px]">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-[5px] h-4 rounded-sm ${i < fuelBarCount ? fuelColor : "bg-[var(--tg-theme-hint-color)]/25"}`}
                />
              ))}
            </div>
            <span className="text-sm text-[var(--tg-theme-text-color)] font-medium">
              {car.fuelLevel}%
            </span>
          </div>
        </div>

        {/* License plate badge */}
        <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-[var(--tg-theme-secondary-bg-color)] rounded-md text-xs text-[var(--tg-theme-hint-color)] font-mono border border-[var(--tg-theme-hint-color)]/15">
          {car.licensePlate}
        </span>
      </div>

      {/* Car Image */}
      <div className="relative h-52 flex items-center justify-center px-8 my-2">
        {car.imageUrl ? (
          <img
            src={car.imageUrl}
            alt={`${car.brand} ${car.model}`}
            className="h-full w-full object-contain drop-shadow-xl"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-28 h-28 text-[var(--tg-theme-hint-color)]/30"
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
          </div>
        )}
        {/* Subtle arc decoration under image */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-8 border-b-2 border-[var(--tg-theme-hint-color)]/15 rounded-b-full" />
      </div>

      {/* Rates section */}
      <div className="flex-1 pb-28">
        <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-3 px-5">
          Тарифы
        </h2>

        {/* Tariff Cards - horizontal scroll with edge-to-edge scrolling */}
        <div
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
          style={{ paddingLeft: "1.25rem", paddingRight: "1.25rem" }}
        >
          {car.tariffs.map((tariff) => {
            const isSelected = selectedTariff?.id === tariff.id;
            return (
              <button
                key={tariff.id}
                onClick={() => handleTariffSelect(tariff)}
                className={`flex-shrink-0 w-40 rounded-2xl overflow-hidden transition-all text-left ${
                  isSelected
                    ? "border-2 border-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/10"
                    : "border-2 border-transparent bg-[var(--tg-theme-secondary-bg-color)]"
                }`}
              >
                {/* Card content with consistent padding */}
                <div className="px-4 pt-4 pb-3">
                  <p className="text-sm font-semibold text-[var(--tg-theme-text-color)] mb-1">
                    {getTariffTitle(tariff.type)}
                  </p>
                  <p className="text-[11px] text-[var(--tg-theme-hint-color)] mb-3 leading-snug">
                    {getTariffDescription(tariff.type)}
                  </p>
                  <p
                    className={`text-xl font-bold ${isSelected ? "text-[var(--color-accent)]" : "price-accent"}`}
                  >
                    {tariff.pricePerUnit} ₽
                  </p>
                  <p className="text-xs text-[var(--tg-theme-hint-color)] mt-0.5">
                    /
                    {tariff.type === "hourly"
                      ? "час"
                      : tariff.type === "daily"
                        ? "сутки"
                        : "мин"}
                  </p>
                </div>
                {/* Bottom accent bar — full width inside card */}
                <div
                  className={`h-1 ${
                    isSelected
                      ? "bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)]"
                      : "bg-gradient-to-r from-[var(--tg-theme-hint-color)]/20 to-[var(--tg-theme-hint-color)]/5"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--tg-theme-bg-color)] border-t border-[var(--color-accent)]/10 safe-area-bottom">
        <Button
          fullWidth
          size="lg"
          onClick={handleRent}
          loading={isCreating}
          disabled={!selectedTariff}
        >
          Арендовать
        </Button>
      </div>
    </div>
  );
}
