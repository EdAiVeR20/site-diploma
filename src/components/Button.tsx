import { type ReactNode } from 'react';

interface ButtonProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
    type?: 'button' | 'submit';
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    loading = false,
    onClick,
    type = 'button',
}: ButtonProps) {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all touch-manipulation active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

    const variantClasses = {
        primary: 'bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]',
        secondary: 'bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)]',
        outline: 'border-2 border-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-color)] bg-transparent',
        danger: 'bg-red-500 text-white',
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''}`}
        >
            {loading ? (
                <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Загрузка...
                </>
            ) : (
                children
            )}
        </button>
    );
}
