import { memo, useState, useEffect, useCallback } from "react";
import { Button } from "./Button";
import { useTelegram } from "../hooks/useTelegram";
import { useCurrentRental } from "../hooks/queries/useRentals";
import {
  useCompleteRental,
  useReportAccident,
} from "../hooks/queries/useRentals";

interface ActiveRentalPanelProps {
  isVisible?: boolean;
}

/**
 * Calculates elapsed time from startTime to now.
 * Returns { hours, minutes, seconds, totalMinutes }
 *
 * ВАЖНО: 1С возвращает startTime в формате "yyyy-MM-ddTHH:mm:ssZ"
 * Символ Z — литерал, а НЕ индикатор UTC! Реальное время — локальное (Москва).
 * JavaScript интерпретирует Z как UTC, поэтому нужно убрать его перед парсингом.
 */
function getElapsedTime(startTime: string) {
  // Убираем суффикс Z, чтобы JavaScript парсил как локальное время
  const cleanedTime = startTime.replace(/Z$/i, "");
  const start = new Date(cleanedTime).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - start);
  const totalSeconds = Math.floor(diff / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds, totalMinutes };
}

/**
 * Formats elapsed time as "HH:MM:SS"
 */
function formatElapsed(h: number, m: number, s: number) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export const ActiveRentalPanel = memo(function ActiveRentalPanel({
  isVisible = true,
}: ActiveRentalPanelProps) {
  const { hapticFeedback, showConfirm, showAlert } = useTelegram();
  const { data: currentRentalData } = useCurrentRental();
  const { mutateAsync: completeRental, isPending: isCompleting } =
    useCompleteRental();
  const { mutateAsync: reportAccident, isPending: isReporting } =
    useReportAccident();

  const rental = currentRentalData?.rental ?? null;

  // Live timer state
  const [elapsed, setElapsed] = useState(() => {
    if (rental?.startTime) {
      return getElapsedTime(rental.startTime);
    }
    return { hours: 0, minutes: 0, seconds: 0, totalMinutes: 0 };
  });

  useEffect(() => {
    if (!rental?.startTime) return;

    const interval = setInterval(() => {
      setElapsed(getElapsedTime(rental.startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [rental?.startTime]);

  // Calculate live cost — round to 2 decimals to avoid IEEE 754 float noise
  const liveCostRaw = rental?.tariff?.pricePerUnit
    ? Math.max(1, elapsed.totalMinutes) * rental.tariff.pricePerUnit
    : 0;
  const liveCost = Math.round(liveCostRaw * 100) / 100;

  const handleComplete = useCallback(async () => {
    if (!rental) return;

    const confirmed = await showConfirm(
      `Завершить поездку на ${rental.car.brand} ${rental.car.model}?\n\nВремя: ${formatElapsed(elapsed.hours, elapsed.minutes, elapsed.seconds)}\nСтоимость: ~${liveCost.toFixed(2)} ₽`,
    );
    if (!confirmed) return;

    try {
      hapticFeedback("medium");
      const result = await completeRental({ rentalId: rental.rentalId });
      hapticFeedback("success");
      await showAlert(
        `Поездка завершена!\n\nИтого: ${Number(result.totalCost).toFixed(2)} ₽\nНовый баланс: ${Number(result.newBalance).toFixed(2)} ₽`,
      );
    } catch {
      hapticFeedback("error");
      await showAlert("Не удалось завершить поездку. Попробуйте ещё раз.");
    }
  }, [
    rental,
    elapsed,
    liveCost,
    completeRental,
    hapticFeedback,
    showConfirm,
    showAlert,
  ]);

  // Don't render if no active rental or panel is hidden
  if (!isVisible || !rental) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[50] px-4 pb-4 safe-area-bottom">
      <div
        className="rounded-2xl overflow-hidden shadow-2xl border border-[var(--color-accent)]/20 backdrop-blur-sm"
        style={{
          background:
            "linear-gradient(135deg, var(--tg-theme-bg-color) 0%, var(--tg-theme-secondary-bg-color) 100%)",
        }}
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent-light)] to-[var(--color-accent)]" />

        <div className="p-4">
          {/* Header Row: Status + Car Info */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {/* Pulsing live indicator */}
              <div className="relative flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <div className="absolute w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-75" />
              </div>
              <span className="text-xs font-semibold text-green-500 uppercase tracking-wider">
                В поездке
              </span>
            </div>
            <span className="text-xs text-[var(--tg-theme-hint-color)] font-mono bg-[var(--tg-theme-secondary-bg-color)] px-2 py-0.5 rounded-md border border-[var(--tg-theme-hint-color)]/15">
              {rental.car.licensePlate}
            </span>
          </div>

          {/* Car Name */}
          <h3 className="text-lg font-bold text-[var(--tg-theme-text-color)] mb-3">
            {rental.car.brand} {rental.car.model}
          </h3>

          {/* Timer + Cost Row */}
          <div className="flex items-center gap-3 mb-4">
            {/* Timer */}
            <div className="flex-1 flex items-center gap-2 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl px-3 py-2.5">
              <svg
                className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-lg font-mono font-bold text-[var(--tg-theme-text-color)] tabular-nums">
                {formatElapsed(elapsed.hours, elapsed.minutes, elapsed.seconds)}
              </span>
            </div>

            {/* Cost */}
            <div className="flex-1 flex items-center gap-2 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl px-3 py-2.5">
              <svg
                className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-lg font-bold price-accent tabular-nums">
                ~{liveCost.toFixed(2)} ₽
              </span>
            </div>
          </div>

          {/* Tariff info */}
          <div className="flex items-center justify-between mb-4 text-xs text-[var(--tg-theme-hint-color)]">
            <span>Тариф: {rental.tariff.name}</span>
            <span>{rental.tariff.pricePerUnit} ₽/мин</span>
          </div>

          {/* Complete Button */}
          <Button
            fullWidth
            size="lg"
            variant="danger"
            onClick={handleComplete}
            loading={isCompleting}
            disabled={isReporting}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
              Завершить поездку
            </div>
          </Button>

          {/* Accident Report Button */}
          <button
            type="button"
            className="w-full mt-2 py-2.5 rounded-xl text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 active:bg-red-500/20 transition-colors disabled:opacity-50"
            onClick={async () => {
              if (!rental) return;
              const confirmed = await showConfirm(
                "⚠️ Вы уверены, что хотите сообщить об аварии?\n\nАренда будет завершена, автомобиль получит статус \"Авария\", оператор будет уведомлён.",
              );
              if (!confirmed) return;
              try {
                hapticFeedback("heavy");
                const result = await reportAccident({
                  rentalId: rental.rentalId,
                  description: `ДТП: ${rental.car.brand} ${rental.car.model} (${rental.car.licensePlate})`,
                });
                hapticFeedback("success");
                await showAlert(
                  result.message || "Аварийная ситуация зарегистрирована. Оператор уведомлён.",
                );
              } catch {
                hapticFeedback("error");
                await showAlert("Не удалось отправить сообщение. Попробуйте ещё раз.");
              }
            }}
            disabled={isCompleting || isReporting}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Сообщить о ДТП
            </div>
          </button>
        </div>
      </div>
    </div>
  );
});
