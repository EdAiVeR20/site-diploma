import apiClient from './client';
import type {
    AuthResponse,
    CarsResponse,
    RentalResponse,
    CompleteRentalResponse,
    RentalHistoryResponse,
    ProfileResponse,
    VerificationResponse,
    CreateRentalRequest,
    CompleteRentalRequest,
} from '../types';

// Auth API
export const authApi = {
    /**
     * Авторизация через Telegram
     * Init data передаётся автоматически через interceptor
     */
    login: async (): Promise<AuthResponse> => {
        const { data } = await apiClient.post<AuthResponse>('/auth/telegram');
        if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
        }
        return data;
    },

    logout: () => {
        localStorage.removeItem('accessToken');
    },
};

// Cars API
export const carsApi = {
    /**
     * Получить список доступных машин
     */
    getAvailable: async (lat?: number, lon?: number, radius?: number): Promise<CarsResponse> => {
        const params = new URLSearchParams();
        if (lat !== undefined) params.append('lat', lat.toString());
        if (lon !== undefined) params.append('lon', lon.toString());
        if (radius !== undefined) params.append('radius', radius.toString());

        const { data } = await apiClient.get<CarsResponse>(`/cars?${params.toString()}`);
        return data;
    },

    /**
     * Получить машину по ID
     */
    getById: async (carId: string) => {
        const { data } = await apiClient.get(`/cars/${carId}`);
        return data;
    },
};

// Rentals API
export const rentalsApi = {
    /**
     * Создать новую аренду
     */
    create: async (request: CreateRentalRequest): Promise<RentalResponse> => {
        const { data } = await apiClient.post<RentalResponse>('/rentals', request);
        return data;
    },

    /**
     * Получить текущую активную аренду
     */
    getCurrent: async (): Promise<RentalResponse | null> => {
        try {
            const { data } = await apiClient.get<RentalResponse>('/rentals/current');
            return data;
        } catch {
            return null;
        }
    },

    /**
     * Завершить аренду
     */
    complete: async (rentalId: string, request: CompleteRentalRequest): Promise<CompleteRentalResponse> => {
        const { data } = await apiClient.post<CompleteRentalResponse>(
            `/rentals/${rentalId}/complete`,
            request
        );
        return data;
    },

    /**
     * История поездок
     */
    getHistory: async (): Promise<RentalHistoryResponse> => {
        const { data } = await apiClient.get<RentalHistoryResponse>('/rentals/history');
        return data;
    },
};

// Users API
export const usersApi = {
    /**
     * Получить профиль текущего пользователя
     */
    getProfile: async (): Promise<ProfileResponse> => {
        const { data } = await apiClient.get<ProfileResponse>('/users/profile');
        return data;
    },
};

// Verification API
export const verificationApi = {
    /**
     * Загрузить документы для верификации
     */
    uploadDocuments: async (
        passportPhoto: File,
        licensePhoto: File,
        selfiePhoto: File
    ): Promise<VerificationResponse> => {
        const formData = new FormData();
        formData.append('passportPhoto', passportPhoto);
        formData.append('licensePhoto', licensePhoto);
        formData.append('selfiePhoto', selfiePhoto);

        const { data } = await apiClient.post<VerificationResponse>('/verification/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    },

    /**
     * Получить статус верификации
     */
    getStatus: async () => {
        const { data } = await apiClient.get('/verification/status');
        return data;
    },
};
