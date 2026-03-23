interface LocationButtonProps {
  onClick: () => void;
}

export function LocationButton({ onClick }: LocationButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-12 h-12 rounded-full bg-[var(--tg-theme-bg-color)] shadow-lg flex items-center justify-center border border-[var(--tg-theme-hint-color)]/20 active:scale-95 transition-transform"
      aria-label="Моё местоположение"
    >
      <svg
        className="w-6 h-6 text-[var(--tg-theme-text-color)]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="3" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 2v4m0 12v4m10-10h-4M6 12H2"
        />
        <circle cx="12" cy="12" r="8" strokeDasharray="2 2" />
      </svg>
    </button>
  );
}
