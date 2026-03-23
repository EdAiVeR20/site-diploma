interface LoaderProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  text?: string;
}

export function Loader({ size = "md", fullScreen = false, text }: LoaderProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const spinner = (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-[var(--tg-theme-hint-color)] border-t-[var(--tg-theme-button-color)]`}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--tg-theme-bg-color)] z-50 gap-3">
        {spinner}
        {text && (
          <p className="text-sm text-[var(--tg-theme-hint-color)]">{text}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      {spinner}
      {text && (
        <p className="text-sm text-[var(--tg-theme-hint-color)]">{text}</p>
      )}
    </div>
  );
}
