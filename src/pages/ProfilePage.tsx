import { useEffect } from 'react';
import { Button, Loader } from '../components';
import { useTelegram } from '../hooks/useTelegram';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchProfile } from '../store/slices/profileSlice';
import type { VerificationStatus } from '../types';

interface ProfilePageProps {
    onNavigateToVerification: () => void;
}

export function ProfilePage({ onNavigateToVerification }: ProfilePageProps) {
    const dispatch = useAppDispatch();
    const { user: tgUser, showAlert, hapticFeedback } = useTelegram();
    const { telegramUser } = useAppSelector((state) => state.auth);
    const { user: profile, isLoading } = useAppSelector((state) => state.profile);

    useEffect(() => {
        dispatch(fetchProfile());
    }, [dispatch]);

    const getVerificationStatusText = (status: VerificationStatus): { text: string; color: string } => {
        switch (status) {
            case 'approved':
                return { text: 'Подтверждён', color: 'text-green-500' };
            case 'pending':
                return { text: 'На проверке', color: 'text-yellow-500' };
            case 'rejected':
                return { text: 'Отклонён', color: 'text-red-500' };
            default:
                return { text: 'Не пройдена', color: 'text-[var(--tg-theme-hint-color)]' };
        }
    };

    const handleLogout = async () => {
        hapticFeedback('warning');
        await showAlert('Для выхода закройте мини-приложение');
    };

    if (isLoading) {
        return <Loader fullScreen text="Загрузка профиля..." />;
    }

    const displayUser = tgUser || telegramUser;
    const verificationInfo = getVerificationStatusText(profile?.verificationStatus ?? 'none');

    return (
        <div className="flex flex-col min-h-full px-4 pt-6 pb-20">
            {/* Avatar and Name */}
            <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-[var(--tg-theme-button-color)] flex items-center justify-center text-[var(--tg-theme-button-text-color)] text-2xl font-bold mb-3">
                    {displayUser?.firstName?.charAt(0) || profile?.firstName?.charAt(0) || '?'}
                </div>
                <h1 className="text-xl font-bold text-[var(--tg-theme-text-color)]">
                    {displayUser?.firstName || profile?.firstName} {displayUser?.lastName || profile?.lastName}
                </h1>
                {(displayUser?.username || profile?.username) && (
                    <p className="text-sm text-[var(--tg-theme-hint-color)]">
                        @{displayUser?.username || profile?.username}
                    </p>
                )}
            </div>

            {/* Balance Card */}
            <div className="bg-gradient-to-br from-[var(--tg-theme-button-color)] to-blue-600 rounded-2xl p-5 mb-4 text-[var(--tg-theme-button-text-color)]">
                <p className="text-sm opacity-80 mb-1">Баланс</p>
                <p className="text-3xl font-bold">
                    {profile?.balance?.toLocaleString('ru-RU') ?? 0} ₽
                </p>
            </div>

            {/* Info Cards */}
            <div className="space-y-3 mb-6">
                {/* Verification Status */}
                <div className="flex items-center justify-between p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-bg-color)] flex items-center justify-center">
                            <svg className="w-5 h-5 text-[var(--tg-theme-hint-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--tg-theme-hint-color)]">Верификация</p>
                            <p className={`font-medium ${verificationInfo.color}`}>{verificationInfo.text}</p>
                        </div>
                    </div>
                    {profile?.verificationStatus !== 'approved' && profile?.verificationStatus !== 'pending' && (
                        <Button size="sm" onClick={onNavigateToVerification}>
                            Пройти
                        </Button>
                    )}
                </div>

                {/* Active Rental */}
                {profile?.hasActiveRental && (
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium text-green-500">Активная аренда</p>
                            <p className="text-sm text-[var(--tg-theme-hint-color)]">У вас есть активная поездка</p>
                        </div>
                    </div>
                )}

                {/* Telegram ID (for debugging) */}
                <div className="flex items-center justify-between p-4 bg-[var(--tg-theme-secondary-bg-color)] rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-bg-color)] flex items-center justify-center">
                            <svg className="w-5 h-5 text-[var(--tg-theme-hint-color)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--tg-theme-hint-color)]">Telegram ID</p>
                            <p className="font-medium text-[var(--tg-theme-text-color)]">{displayUser?.id || profile?.telegramId}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout Button */}
            <div className="mt-auto">
                <Button variant="secondary" fullWidth onClick={handleLogout}>
                    Выйти
                </Button>
            </div>
        </div>
    );
}
