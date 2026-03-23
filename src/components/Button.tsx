import { type ReactNode } from "react";
import { Button as LobeButton } from "@lobehub/ui";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = "button",
}: ButtonProps) {
  // Map custom variant to LobeUI (Antd) type
  let lobeType: "text" | "link" | "default" | "primary" | "dashed" | undefined =
    "primary";
  let isDanger = false;

  if (variant === "secondary") lobeType = "default";
  if (variant === "outline") lobeType = "default";
  if (variant === "danger") {
    lobeType = "primary";
    isDanger = true;
  }

  // Map custom size to LobeUI
  let lobeSize: "small" | "middle" | "large" = "middle";
  if (size === "sm") lobeSize = "small";
  if (size === "lg") lobeSize = "large";

  // Telegram Theme Overrides for specific variants to match the mini-app spec
  const styleOverride =
    variant === "primary"
      ? {
          backgroundColor: "var(--tg-theme-button-color)",
          color: "var(--tg-theme-button-text-color)",
          border: "none",
        }
      : undefined;

  return (
    <LobeButton
      type={lobeType}
      danger={isDanger}
      size={lobeSize}
      block={fullWidth}
      disabled={disabled}
      loading={loading}
      onClick={onClick}
      htmlType={type}
      style={styleOverride}
      className="rounded-xl transition-all touch-manipulation active:scale-[0.98]"
    >
      {children}
    </LobeButton>
  );
}
