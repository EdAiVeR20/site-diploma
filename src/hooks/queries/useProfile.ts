import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, verificationApi } from '../../api';
import { APP_CONFIG } from '../../config';
import type { User, VerificationStatus } from '../../types';

const { USE_BACKEND } = APP_CONFIG;

const MOCK_USER: User = {
    id: '1',
    telegramId: 123456789,
    firstName: 'Тест',
    lastName: '',
    username: 'testuser',
    balance: 1500,
    verificationStatus: 'none',
    hasActiveRental: false,
    createdAt: new Date().toISOString(),
};

export const profileKeys = {
    all: ['profile'] as const,
    user: () => [...profileKeys.all, 'user'] as const,
};

interface UseProfileProps {
    telegramUser?: {
        id: number;
        firstName: string;
        lastName?: string;
        username?: string;
    };
}

export const useProfile = ({ telegramUser }: UseProfileProps = {}) => {
    return useQuery({
        queryKey: profileKeys.user(),
        queryFn: async () => {
            // Try to fetch from backend
            if (USE_BACKEND) {
                return await usersApi.getProfile();
            }

            // Fallback to mock data or create from telegram data
            await new Promise((resolve) => setTimeout(resolve, 300));
            if (telegramUser) {
                return {
                    id: String(telegramUser.id),
                    telegramId: telegramUser.id,
                    firstName: telegramUser.firstName,
                    lastName: telegramUser.lastName,
                    username: telegramUser.username,
                    balance: 0,
                    verificationStatus: 'none' as const,
                    hasActiveRental: false,
                    createdAt: new Date().toISOString(),
                };
            }
            return MOCK_USER;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useSubmitVerification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            passport,
            license,
            selfie,
        }: {
            passport: File;
            license: File;
            selfie: File;
        }) => {
            await verificationApi.uploadDocuments(passport, license, selfie);
            return { status: 'pending' as VerificationStatus };
        },
        onSuccess: (data) => {
            // Update the profile query data directly
            queryClient.setQueryData<User | undefined>(profileKeys.user(), (oldData) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    verificationStatus: data.status,
                };
            });
            queryClient.invalidateQueries({ queryKey: profileKeys.user() });
        },
    });
};
