/**
 * Centralized application configuration.
 * All feature flags read from environment variables (Vite).
 *
 * In .env set:
 *   VITE_DEV_MODE=true    — bypass Telegram, use mock data
 *   VITE_USE_BACKEND=true — use real NestJS backend
 */
export const APP_CONFIG = {
  /** Bypass Telegram auth and use mock data */
  DEV_MODE: import.meta.env.VITE_DEV_MODE === "true",
  /** Use real backend instead of mock data */
  USE_BACKEND: import.meta.env.VITE_USE_BACKEND === "true",
} as const;
