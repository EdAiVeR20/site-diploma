import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rentalsApi } from '../../api';
import { APP_CONFIG } from '../../config';
import type { RentalResponse, CompleteRentalResponse } from '../../types';

const { DEV_MODE } = APP_CONFIG;

export const rentalKeys = {
    all: ['rentals'] as const,
    history: () => [...rentalKeys.all, 'history'] as const,
    current: () => [...rentalKeys.all, 'current'] as const,
};

export const useRentalHistory = () => {
    return useQuery({
        queryKey: rentalKeys.history(),
        queryFn: async () => {
            if (DEV_MODE) {
                await new Promise(resolve => setTimeout(resolve, 300));
                return [];
            }
            const response = await rentalsApi.getHistory();
            return response.rentals;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useCurrentRental = () => {
    return useQuery({
        queryKey: rentalKeys.current(),
        queryFn: async () => {
            if (DEV_MODE) {
                return null;
            }
            return await rentalsApi.getCurrent();
        },
        // Auto-refresh the current rental status every minute if active
        refetchInterval: (query) => (query.state.data ? 60000 : false),
    });
};

export const useCreateRental = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ carId, tariffId }: { carId: string; tariffId: string }) => {
            if (DEV_MODE) {
                await new Promise(resolve => setTimeout(resolve, 500));
                const mockResponse: RentalResponse = {
                    rentalId: `rental-${Date.now()}`,
                    status: 'active',
                    car: { brand: 'Test', model: 'Car' },
                    tariff: { name: 'Почасовой', pricePerUnit: 450 },
                    startTime: new Date().toISOString(),
                    estimatedCost: 450,
                };
                return mockResponse;
            }
            return await rentalsApi.create({ carId, tariffId });
        },
        onSuccess: (newRental) => {
            // Update the current rental in the cache
            queryClient.setQueryData(rentalKeys.current(), newRental);
            // Invalidate history so it refetches next time it's needed
            queryClient.invalidateQueries({ queryKey: rentalKeys.history() });
        },
    });
};

export const useCompleteRental = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ rentalId, endLatitude, endLongitude }: { rentalId: string; endLatitude: number; endLongitude: number }) => {
            if (DEV_MODE) {
                await new Promise(resolve => setTimeout(resolve, 500));
                const mockResponse: CompleteRentalResponse = {
                    rentalId,
                    status: 'completed',
                    duration: 120,
                    totalCost: 900,
                    newBalance: 5000,
                };
                return mockResponse;
            }
            return await rentalsApi.complete(rentalId, { endLatitude, endLongitude });
        },
        onSuccess: () => {
            // Clear current rental
            queryClient.setQueryData(rentalKeys.current(), null);
            // Invalidate history
            queryClient.invalidateQueries({ queryKey: rentalKeys.history() });
        },
    });
};
