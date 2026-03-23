interface GeolocationWarningProps {
  message?: string;
  onDismiss?: () => void;
}

export function GeolocationWarning({
  message = "Включите геолокацию для корректной работы карты",
  onDismiss,
}: GeolocationWarningProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-amber-500 text-black px-4 py-2.5 flex items-center justify-between gap-2 shadow-lg">
      <div className="flex items-center gap-2">
        {/* Warning Icon */}
        <svg
          className="w-5 h-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-amber-600 rounded transition-colors shrink-0"
          aria-label="Закрыть"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
