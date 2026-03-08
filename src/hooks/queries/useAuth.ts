import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api';
import { APP_CONFIG } from '../../config';
import type { TelegramUser, AuthResponse } from '../../types';

const { USE_BACKEND } = APP_CONFIG;

export const useLogin = () => {
    return useMutation({
        mutationFn: async ({ user, initData, phoneNumber }: { user?: TelegramUser; initData?: string; phoneNumber?: string }) => {
            // If no backend, return auth response based on Telegram data
            if (!USE_BACKEND) {
                await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network
                if (user) {
                    return {
                        userId: String(user.id),
                        isVerified: false,
                        balance: 0,
                        accessToken: 'mock-token',
                    } as AuthResponse;
                }
                // No Telegram user - still allow for demo
                return {
                    userId: 'demo',
                    isVerified: false,
                    balance: 0,
                    accessToken: 'mock-token',
                } as AuthResponse;
            }

            // Use backend for authentication (with optional phone number)
            return await authApi.login(initData || '', phoneNumber);
        },
    });
};
