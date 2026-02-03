import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Backend API URL - will be set via environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add Telegram Init Data
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Get Telegram WebApp init data
        const tg = window.Telegram?.WebApp;
        if (tg?.initData) {
            config.headers.Authorization = `tma ${tg.initData}`;
        }

        // Add stored JWT token if available
        const token = localStorage.getItem('accessToken');
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to auth
            localStorage.removeItem('accessToken');
        }
        return Promise.reject(error);
    }
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
                colorScheme: 'light' | 'dark';
                viewportHeight: number;
                viewportStableHeight: number;
                isExpanded: boolean;
                setHeaderColor: (color: string) => void;
                setBackgroundColor: (color: string) => void;
                enableClosingConfirmation: () => void;
                disableClosingConfirmation: () => void;
                showAlert: (message: string, callback?: () => void) => void;
                showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
                HapticFeedback: {
                    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
                    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
                    selectionChanged: () => void;
                };
            };
        };
    }
}
