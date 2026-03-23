import { useState, useCallback } from "react";
import { Button, Loader } from "../components";
import { useTelegram } from "../hooks/useTelegram";
import { useAppSelector, useAppDispatch } from "../store";
import { setPhoneNumber } from "../store/slices/authSlice";
import { useProfile } from "../hooks/queries/useProfile";
import type { VerificationStatus } from "../types";

interface ProfilePageProps {
  onNavigateToVerification: () => void;
}

export function ProfilePage({ onNavigateToVerification }: ProfilePageProps) {
  const dispatch = useAppDispatch();
  const {
    user: tgUser,
    showAlert,
    hapticFeedback,
    requestContact,
  } = useTelegram();
  const { telegramUser, balance, phoneNumber } = useAppSelector(
    (state) => state.auth,
  );
  const [isRequesting, setIsRequesting] = useState(false);

  const tgUserData = tgUser
    ? {
        id: tgUser.id,
        firstName: tgUser.firstName,
        lastName: tgUser.lastName,
        username: tgUser.username,
      }
    : undefined;

  const { data: profile, isLoading } = useProfile({ telegramUser: tgUserData });

  const getVerificationStatusText = (
    status: VerificationStatus,
  ): { text: string; badgeClass: string } => {
    switch (status) {
      case "approved":
        return { text: "Подтверждён", badgeClass: "badge-success" };
      case "pending":
        return { text: "На проверке", badgeClass: "badge-warning" };
      case "rejected":
        return { text: "Отклонён", badgeClass: "badge-error" };
      default:
        return {
          text: "Не пройдена",
          badgeClass: "text-[var(--tg-theme-hint-color)]",
        };
    }
  };

  const handleRequestPhone = useCallback(async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      const result = await requestContact();
      if (result === "shared") {
        hapticFeedback("success");
        dispatch(setPhoneNumber("shared"));
      }
    } catch {
      // User cancelled — that's ok
    } finally {
      setIsRequesting(false);
    }
  }, [isRequesting, requestContact, hapticFeedback, dispatch]);

  const handleLogout = async () => {
    hapticFeedback("warning");
    await showAlert("Для выхода закройте мини-приложение");
  };

  const displayUser = tgUser || telegramUser;
  const verificationInfo = getVerificationStatusText(
    profile?.verificationStatus ?? "none",
  );

  // Use profile data from 1C if available, fallback to Redux state
  const displayBalance =
    profile?.balance !== undefined ? profile.balance : balance;
  // Filter out the 'shared' placeholder — it's not a real phone number
  const profilePhone = profile?.phoneNumber;
  const reduxPhone =
    phoneNumber && phoneNumber !== "shared" ? phoneNumber : null;
  const displayPhone = profilePhone || reduxPhone;
  const hasPhone = !!displayPhone;

  if (isLoading && !displayUser && !hasPhone) {
    return <Loader fullScreen text="Загрузка профиля..." />;
  }

  return (
    <div className="flex flex-col min-h-full px-4 pt-4 pb-6">
      {/* Avatar and Name */}
      <div className="flex flex-col items-center mb-6 animate-scale-in">
        <div className="avatar-ring mb-3">
          <div className="avatar-inner">
            {tgUser?.photoUrl ? (
              <img
                src={tgUser.photoUrl}
                alt={displayUser?.firstName || ""}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-2xl font-bold">
                {displayUser?.firstName?.charAt(0) ||
                  profile?.firstName?.charAt(0) ||
                  "?"}
              </div>
            )}
          </div>
        </div>
        <h1 className="text-xl font-bold text-[var(--tg-theme-text-color)]">
          {displayUser?.firstName || profile?.firstName}{" "}
          {displayUser?.lastName || profile?.lastName}
        </h1>
        {(displayUser?.username || profile?.username) && (
          <p className="text-sm text-[var(--tg-theme-hint-color)]">
            @{displayUser?.username || profile?.username}
          </p>
        )}
      </div>

      {/* Balance Card */}
      <div
        className="balance-card mb-4 text-white animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <p className="text-sm opacity-80 mb-1">Баланс</p>
        <p className="text-3xl font-bold tracking-tight">
          {(displayBalance ?? 0).toLocaleString("ru-RU")} ₽
        </p>
      </div>

      {/* Info Cards */}
      <div className="space-y-3 mb-6">
        {/* Verification Status */}
        <div
          className="p-4 card animate-slide-up"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[var(--tg-theme-hint-color)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--tg-theme-hint-color)]">
                Верификация
              </p>
              <p className={`font-medium ${verificationInfo.badgeClass}`}>
                {verificationInfo.text}
              </p>
            </div>
            {profile?.verificationStatus !== "approved" &&
              profile?.verificationStatus !== "pending" && (
                <Button size="sm" onClick={onNavigateToVerification}>
                  Пройти
                </Button>
              )}
          </div>
        </div>

        {/* Active Rental */}
        {profile?.hasActiveRental && (
          <div
            className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-green-500">Активная аренда</p>
              <p className="text-sm text-[var(--tg-theme-hint-color)]">
                У вас есть активная поездка
              </p>
            </div>
          </div>
        )}

        {/* Phone Number */}
        <div
          className="flex items-center gap-3 p-4 card animate-slide-up"
          style={{ animationDelay: "0.22s" }}
        >
          <div className="w-10 h-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[var(--tg-theme-hint-color)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[var(--tg-theme-hint-color)]">Телефон</p>
            {hasPhone ? (
              <p className="font-medium text-[var(--tg-theme-text-color)]">
                {displayPhone || "Привязан к Telegram"}
              </p>
            ) : (
              <p className="font-medium text-[var(--tg-theme-hint-color)]">
                Не указан
              </p>
            )}
          </div>
          {!hasPhone && (
            <Button
              size="sm"
              onClick={handleRequestPhone}
              disabled={isRequesting}
            >
              {isRequesting ? "..." : "Указать"}
            </Button>
          )}
        </div>

        {/* Telegram ID */}
        <div
          className="flex items-center gap-3 p-4 card animate-slide-up"
          style={{ animationDelay: "0.25s" }}
        >
          <div className="w-10 h-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[var(--tg-theme-hint-color)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-[var(--tg-theme-hint-color)]">
              Telegram ID
            </p>
            <p className="font-medium text-[var(--tg-theme-text-color)]">
              {displayUser?.id || profile?.telegramId}
            </p>
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
