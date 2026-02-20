import { useEffect } from 'react';
import { Button } from '../components';
import { useTelegram } from '../hooks/useTelegram';
import { useAppDispatch, useAppSelector } from '../store';
import { createRental, selectTariff, clearSelectedTariff } from '../store/slices/rentalsSlice';
import type { Car, Tariff } from '../types';

interface RentalPageProps {
    car: Car;
    onClose: () => void;
    onSuccess: () => void;
}

export function RentalPage({ car, onClose, onSuccess }: RentalPageProps) {
    const dispatch = useAppDispatch();
    const { showBackButton, hideBackButton, hapticFeedback, showAlert, showConfirm } = useTelegram();
    const { selectedTariff, isCreating } = useAppSelector((state) => state.rentals);

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
        hapticFeedback('light');
    };

    const handleRent = async () => {
        if (!selectedTariff) {
            await showAlert('Выберите тариф');
            return;
        }

        const confirmed = await showConfirm(
            `Арендовать ${car.brand} ${car.model} по тарифу "${selectedTariff.name}" (${selectedTariff.pricePerUnit} ₽/${selectedTariff.type === 'hourly' ? 'час' : selectedTariff.type === 'daily' ? 'сутки' : 'мин'})?`
        );

        if (!confirmed) return;

        try {
            hapticFeedback('medium');
            await dispatch(createRental({
                carId: car.id,
                tariffId: selectedTariff.id,
            })).unwrap();

            hapticFeedback('success');
            await showAlert('Аренда успешно оформлена!');
            onSuccess();
        } catch (err) {
            hapticFeedback('error');
            await showAlert('Не удалось оформить аренду. Попробуйте позже.');
            console.error(err);
        }
    };

    const getTariffDescription = (type: 'hourly' | 'daily' | 'minute') => {
        const descriptions = {
            minute: 'Для коротких поездок',
            hourly: 'Для поездок на несколько часов',
            daily: 'Для длительных поездок',
        };
        return descriptions[type] || '';
    };

    const getTariffTitle = (type: 'hourly' | 'daily' | 'minute') => {
        const titles = {
            minute: 'В минуту',
            hourly: 'В час',
            daily: 'В сутки',
        };
        return titles[type] || type;
    };

    return (
        <div className="flex flex-col min-h-full bg-[var(--tg-theme-bg-color)]">
            {/* Car Image Header */}
            <div className="relative h-64 bg-gradient-to-b from-[var(--color-surface)] to-[var(--tg-theme-bg-color)]">
                {car.imageUrl ? (
                    <img
                        src={car.imageUrl}
                        alt={`${car.brand} ${car.model}`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-24 h-24 text-[var(--tg-theme-hint-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0l-2-4h12l-2 4M6 13V9a2 2 0 012-2h8a2 2 0 012 2v4" />
                        </svg>
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--tg-theme-bg-color)] via-transparent to-transparent" />

                {/* Back button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 w-10 h-10 rounded-full glass flex items-center justify-center text-white"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Car Info */}
            <div className="flex-1 px-4 -mt-8 relative z-10 pb-28">
                {/* Title and License */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color)]">
                            {car.brand} {car.model}
                        </h1>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-[var(--color-surface)] rounded text-xs text-[var(--tg-theme-hint-color)]">
                            {car.licensePlate}
                        </span>
                    </div>
                    {/* Fuel indicator */}
                    <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                            {[...Array(4)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1.5 h-4 rounded-sm ${i < Math.ceil(car.fuelLevel / 25)
                                        ? car.fuelLevel > 25 ? 'bg-green-500' : 'bg-red-500'
                                        : 'bg-[var(--color-surface)]'
                                        }`}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-[var(--tg-theme-text-color)] font-medium">{car.fuelLevel}%</span>
                    </div>
                </div>

                {/* Fuel label */}
                <div className="flex items-center gap-2 mb-6">
                    <svg className="w-5 h-5 text-[var(--tg-theme-hint-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm text-[var(--tg-theme-hint-color)]">Топливо</span>
                </div>

                {/* Tariff Selection */}
                <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-3">
                    Выберите тариф
                </h2>

                {/* Tariff Cards - horizontal scroll */}
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    {car.tariffs.map((tariff) => {
                        const isSelected = selectedTariff?.id === tariff.id;
                        return (
                            <button
                                key={tariff.id}
                                onClick={() => handleTariffSelect(tariff)}
                                className={`flex-shrink-0 w-32 p-3 rounded-xl border-2 transition-all ${isSelected
                                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                                    : 'border-transparent bg-[var(--tg-theme-secondary-bg-color)]'
                                    }`}
                            >
                                <p className="text-sm font-medium text-[var(--tg-theme-text-color)] mb-1">
                                    {getTariffTitle(tariff.type)}
                                </p>
                                <p className="text-[10px] text-[var(--tg-theme-hint-color)] mb-3 line-clamp-2">
                                    {getTariffDescription(tariff.type)}
                                </p>
                                <p className={`text-lg font-bold ${isSelected ? 'text-[var(--color-accent)]' : 'price-accent'}`}>
                                    {tariff.pricePerUnit} ₽
                                </p>
                                <p className="text-[10px] text-[var(--tg-theme-hint-color)]">
                                    /{tariff.type === 'hourly' ? 'час' : tariff.type === 'daily' ? 'сутки' : 'мин'}
                                </p>
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
