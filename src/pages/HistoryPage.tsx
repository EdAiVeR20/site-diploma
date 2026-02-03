import { useEffect } from 'react';
import { Loader } from '../components';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchRentalHistory } from '../store/slices/rentalsSlice';
import type { Rental } from '../types';

export function HistoryPage() {
    const dispatch = useAppDispatch();
    const { history: rentals, isLoading } = useAppSelector((state) => state.rentals);

    useEffect(() => {
        dispatch(fetchRentalHistory());
    }, [dispatch]);

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDuration = (minutes: number): string => {
        if (minutes < 60) return `${minutes} мин`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
    };

    const getStatusBadge = (status: Rental['status']) => {
        const styles = {
            completed: 'bg-green-500/10 text-green-500',
            active: 'bg-blue-500/10 text-blue-500',
            pending: 'bg-yellow-500/10 text-yellow-500',
            cancelled: 'bg-red-500/10 text-red-500',
        };
        const labels = {
            completed: 'Завершена',
            active: 'Активна',
            pending: 'Ожидает',
            cancelled: 'Отменена',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    if (isLoading) {
        return <Loader fullScreen text="Загрузка истории..." />;
    }

    return (
        <div className="flex flex-col min-h-full px-4 pt-6 pb-20">
            <h1 className="text-xl font-bold text-[var(--tg-theme-text-color)] mb-4">
                История поездок
            </h1>

            {rentals.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <svg className="w-16 h-16 text-[var(--tg-theme-hint-color)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-2">
                        Пока нет поездок
                    </h2>
                    <p className="text-sm text-[var(--tg-theme-hint-color)]">
                        Ваши поездки появятся здесь после первой аренды
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {rentals.map((rental) => (
                        <div
                            key={rental.id}
                            className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-4"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-[var(--tg-theme-text-color)]">
                                        {rental.car.brand} {rental.car.model}
                                    </h3>
                                    <p className="text-sm text-[var(--tg-theme-hint-color)]">
                                        {formatDate(rental.startTime)}
                                    </p>
                                </div>
                                {getStatusBadge(rental.status)}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[var(--tg-theme-hint-color)]/20">
                                <div className="flex items-center gap-4">
                                    {rental.duration && (
                                        <div className="flex items-center gap-1 text-sm text-[var(--tg-theme-hint-color)]">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {formatDuration(rental.duration)}
                                        </div>
                                    )}
                                    <div className="text-sm text-[var(--tg-theme-hint-color)]">
                                        {rental.tariff.name}
                                    </div>
                                </div>
                                {rental.totalCost && (
                                    <div className="font-bold text-[var(--tg-theme-text-color)]">
                                        {rental.totalCost} ₽
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
