import { memo } from "react";
import { useAppSelector } from "../store";
import { useTelegram } from "../hooks/useTelegram";
import { useProfile } from "../hooks/queries/useProfile";
import { Drawer } from "@lobehub/ui";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: "history" | "profile") => void;
}

export const SideDrawer = memo(function SideDrawer({
  isOpen,
  onClose,
  onNavigate,
}: SideDrawerProps) {
  const { user: tgUser } = useTelegram();
  const { telegramUser } = useAppSelector((state) => state.auth);
  const { data: profile } = useProfile();

  // Get user info from TG SDK or Redux
  const displayUser = tgUser || telegramUser;
  const displayName = displayUser
    ? `${displayUser.firstName}${displayUser.lastName ? " " + displayUser.lastName : ""}`
    : "GoShare";
  const displayUsername = displayUser?.username
    ? `@${displayUser.username}`
    : "Каршеринг";
  const photoUrl = tgUser?.photoUrl || null;
  const initial = displayUser?.firstName?.charAt(0) || "G";
  const balance = profile?.balance ?? 0;
  const formattedBalance = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(balance);

  const handleNavigate = (page: "history" | "profile") => {
    onNavigate(page);
    onClose();
  };

  // Click on avatar/name area -> profile
  const handleAvatarClick = () => {
    handleNavigate("profile");
  };

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      placement="left"
      width={280}
      styles={{
        header: { display: "none" },
        body: { padding: 0, backgroundColor: "var(--tg-theme-bg-color)" },
      }}
    >
      <div className="flex flex-col h-full bg-[var(--tg-theme-bg-color)]">
        {/* Header - User Info (clickable -> profile) */}
        <div
          className="p-6 border-b border-[var(--tg-theme-hint-color)]/20 cursor-pointer active:bg-[var(--tg-theme-secondary-bg-color)] transition-colors"
          onClick={handleAvatarClick}
        >
          <div className="flex items-center gap-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={displayName}
                className="w-14 h-14 rounded-full object-cover border-2 border-[var(--color-accent)]"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-xl font-bold">
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-[var(--tg-theme-text-color)] truncate">
                {displayName}
              </h2>
              <p className="text-sm text-[var(--tg-theme-hint-color)] truncate">
                {displayUsername}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <svg
                  className="w-3.5 h-3.5 text-emerald-400"
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
                <span className="text-sm font-semibold text-emerald-400">
                  {formattedBalance}
                </span>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-[var(--tg-theme-hint-color)] flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <button
            onClick={() => handleNavigate("profile")}
            className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-[var(--tg-theme-secondary-bg-color)] transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[var(--tg-theme-hint-color)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-[var(--tg-theme-text-color)]">
                Профиль
              </p>
              <p className="text-xs text-[var(--tg-theme-hint-color)]">
                Баланс, верификация
              </p>
            </div>
          </button>

          <button
            onClick={() => handleNavigate("history")}
            className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-[var(--tg-theme-secondary-bg-color)] transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-secondary-bg-color)] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[var(--tg-theme-hint-color)]"
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
            </div>
            <div>
              <p className="font-medium text-[var(--tg-theme-text-color)]">
                История поездок
              </p>
              <p className="text-xs text-[var(--tg-theme-hint-color)]">
                Прошлые аренды
              </p>
            </div>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--tg-theme-hint-color)]/20 mt-auto">
          <p className="text-xs text-[var(--tg-theme-hint-color)] text-center">
            GoShare v1.0.0
          </p>
        </div>
      </div>
    </Drawer>
  );
});
