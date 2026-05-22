import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";

// Backend API URL - will be set via environment variable
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create axios instance
// Do NOT set a default Content-Type — axios sets it automatically:
//   plain object  → application/json
//   FormData      → multipart/form-data; boundary=<auto>  ← required for file uploads
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

import { APP_CONFIG } from "../config";

// Request interceptor to add auth headers
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Priority 1: Use stored JWT token for authenticated endpoints (profile, rentals, etc.)
    // The JwtAuthGuard on the backend expects 'Bearer <token>' format
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Priority 2: Fallback to Telegram initData (only for /auth/telegram endpoint)
    // This is used during the initial login when we don't have a JWT yet
    if (!config.headers.Authorization) {
      const tg = window.Telegram?.WebApp;
      if (tg?.initData) {
        config.headers.Authorization = `tma ${tg.initData}`;
      }
    }

    if (APP_CONFIG.DEV_MODE) {
      console.log(
        `[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`,
        config.params || config.data || "",
      );
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? "";
    const status: number | undefined = error.response?.status;

    // Clear the stored JWT only when a PROTECTED endpoint returns 401 —
    // meaning the token has genuinely expired or is invalid.
    //
    // Do NOT clear it when the auth endpoint itself returns 401: that means
    // the initData signature was rejected (e.g. replayed token, wrong bot),
    // and the stored JWT might still be perfectly valid for other calls.
    const isAuthEndpoint = url.includes("/auth/telegram");
    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("accessToken");
      if (APP_CONFIG.DEV_MODE) {
        console.error("[API ERROR 401] Token expired or invalid — cleared.");
      }
    }

    if (APP_CONFIG.DEV_MODE) {
      console.error(
        `[API ERROR] ${status ?? "Network"} at ${url}:`,
        error.response?.data ?? error.message,
      );
    }
    return Promise.reject(error);
  },
);

export default apiClient;

// Type declaration for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          auth_date: number;
          hash: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          setText: (text: string) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        colorScheme: "light" | "dark";
        viewportHeight: number;
        viewportStableHeight: number;
        isExpanded: boolean;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        enableClosingConfirmation: () => void;
        disableClosingConfirmation: () => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (
          message: string,
          callback?: (confirmed: boolean) => void,
        ) => void;
        HapticFeedback: {
          impactOccurred: (
            style: "light" | "medium" | "heavy" | "rigid" | "soft",
          ) => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}
