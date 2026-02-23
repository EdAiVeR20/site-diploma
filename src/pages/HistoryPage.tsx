import { Loader } from '../components';
import { useRentalHistory } from '../hooks/queries/useRentals';
import type { Rental } from '../types';

export function HistoryPage() {
    const { data: rentals = [], isLoading } = useRentalHistory();

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

    const getStatusInfo = (status: Rental['status']) => {
        const config = {
            completed: { label: 'Завершена', class: 'badge-success' },
            active: { label: 'Активна', class: 'bg-blue-500/15 text-blue-400' },
            pending: { label: 'Ожидает', class: 'badge-warning' },
            cancelled: { label: 'Отменена', class: 'badge-error' },
        };
        return config[status];
    };

    if (isLoading) {
        return <Loader fullScreen text="Загрузка истории..." />;
    }

    return (
        <div className="flex flex-col min-h-full pt-4 pb-6">
            {rentals.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-[var(--color-surface)] flex items-center justify-center mb-5 animate-pulse-slow">
                        <svg className="w-10 h-10 text-[var(--tg-theme-hint-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--tg-theme-text-color)] mb-2">
                        Пока нет поездок
                    </h2>
                    <p className="text-sm text-[var(--tg-theme-hint-color)] max-w-[240px]">
                        Ваши поездки появятся здесь после первой аренды
                    </p>
                </div>
            ) : (
                <div className="flex flex-col">
                    {rentals.map((rental, index) => {
                        const statusInfo = getStatusInfo(rental.status);
                        return (
                            <div
                                key={rental.id}
                                className="mx-4 mb-3 card p-4 animate-slide-up"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {/* Header: Car name + Status */}
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold text-[var(--tg-theme-text-color)] text-base">
                                            {rental.car.brand} {rental.car.model}
                                        </h3>
                                        <p className="text-xs text-[var(--tg-theme-hint-color)] mt-0.5">
                                            {formatDate(rental.startTime)}
                                        </p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
                                        {statusInfo.label}
                                    </span>
                                </div>

                                {/* Footer: Duration, Tariff, Price */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-sm">
                                        {rental.duration && (
                                            <div className="flex items-center gap-1 text-[var(--tg-theme-hint-color)]">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>{formatDuration(rental.duration)}</span>
                                            </div>
                                        )}
                                        <span className="text-[var(--tg-theme-hint-color)]">
                                            {rental.tariff.name}
                                        </span>
                                    </div>
                                    {rental.totalCost && (
                                        <div className="text-right">
                                            <span className="text-lg font-bold price-accent">
                                                {rental.totalCost.toLocaleString('ru-RU')} ₽
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
