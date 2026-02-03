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
            `Арендовать ${car.brand} ${car.model} по тарифу "${selectedTariff.name}" (${selectedTariff.pricePerUnit} ₽/${selectedTariff.type === 'hourly' ? 'час' : 'сутки'})?`
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

    return (
        <div className="flex flex-col min-h-full">
            {/* Car Header */}
            <div className="relative h-48 bg-[var(--tg-theme-secondary-bg-color)]">
                {car.imageUrl ? (
                    <img
                        src={car.imageUrl}
                        alt={`${car.brand} ${car.model}`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-20 h-20 text-[var(--tg-theme-hint-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h8M8 17v-4m8 4v-4m-8 0h8m-8 0l-2-4h12l-2 4M6 13V9a2 2 0 012-2h8a2 2 0 012 2v4" />
                        </svg>
                    </div>
                )}

                {/* Back button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Car Info */}
            <div className="flex-1 px-4 pt-4 pb-24">
                <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color)] mb-1">
                    {car.brand} {car.model}
                </h1>
                <p className="text-[var(--tg-theme-hint-color)] mb-4">{car.licensePlate}</p>

                {/* Car Stats */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-3 text-center">
                        <svg className="w-6 h-6 mx-auto text-[var(--tg-theme-hint-color)] mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <p className="text-lg font-bold text-[var(--tg-theme-text-color)]">{car.fuelLevel}%</p>
                        <p className="text-xs text-[var(--tg-theme-hint-color)]">Топливо</p>
                    </div>
                </div>

                {/* Tariff Selection */}
                <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-3">
                    Выберите тариф
                </h2>
                <div className="space-y-2 mb-6">
                    {car.tariffs.map((tariff) => (
                        <button
                            key={tariff.id}
                            onClick={() => handleTariffSelect(tariff)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedTariff?.id === tariff.id
                                ? 'border-[var(--tg-theme-button-color)] bg-[var(--tg-theme-button-color)]/10'
                                : 'border-transparent bg-[var(--tg-theme-secondary-bg-color)]'
                                }`}
                        >
                            <div className="text-left">
                                <p className="font-medium text-[var(--tg-theme-text-color)]">{tariff.name}</p>
                                <p className="text-sm text-[var(--tg-theme-hint-color)]">
                                    {tariff.type === 'hourly' ? 'Почасовая оплата' : 'Посуточная оплата'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-[var(--tg-theme-button-color)]">
                                    {tariff.pricePerUnit} ₽
                                </p>
                                <p className="text-xs text-[var(--tg-theme-hint-color)]">
                                    /{tariff.type === 'hourly' ? 'час' : 'сутки'}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Action */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--tg-theme-bg-color)] border-t border-[var(--tg-theme-hint-color)]/20 safe-area-bottom">
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
