import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rentalsApi } from "../../api";
import { APP_CONFIG } from "../../config";
import type {
  RentalResponse,
  CompleteRentalResponse,
  CurrentRentalResponse,
} from "../../types";
import { profileKeys } from "./useProfile";

const { USE_BACKEND } = APP_CONFIG;

export const rentalKeys = {
  all: ["rentals"] as const,
  history: () => [...rentalKeys.all, "history"] as const,
  current: () => [...rentalKeys.all, "current"] as const,
};

export const useRentalHistory = () => {
  return useQuery({
    queryKey: rentalKeys.history(),
    queryFn: async () => {
      if (!USE_BACKEND) {
        await new Promise((resolve) => setTimeout(resolve, 300));
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
    queryFn: async (): Promise<CurrentRentalResponse | null> => {
      if (!USE_BACKEND) {
        return null;
      }
      return await rentalsApi.getCurrent();
    },
    refetchOnWindowFocus: true,
    // Auto-refresh the current rental status every 30 seconds if active
    refetchInterval: (query) => (query.state.data?.rental ? 30000 : false),
  });
};

export const useCreateRental = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      carId,
      tariffId,
    }: {
      carId: string;
      tariffId: string;
    }) => {
      if (!USE_BACKEND) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const mockResponse: RentalResponse = {
          rentalId: `rental-${Date.now()}`,
          status: "active",
          car: { brand: "Test", model: "Car" },
          tariff: { name: "Почасовой", pricePerUnit: 450 },
          startTime: new Date().toISOString(),
          estimatedCost: 450,
        };
        return mockResponse;
      }
      return await rentalsApi.create({ carId, tariffId });
    },
    onSuccess: () => {
      // Invalidate everything — cars list, current rental, profile (hasActiveRental)
      queryClient.invalidateQueries({ queryKey: rentalKeys.current() });
      queryClient.invalidateQueries({ queryKey: rentalKeys.history() });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

export const useCompleteRental = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rentalId }: { rentalId: string }) => {
      if (!USE_BACKEND) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const mockResponse: CompleteRentalResponse = {
          rentalId,
          status: "completed",
          duration: 120,
          totalCost: 900,
          newBalance: 5000,
        };
        return mockResponse;
      }

      // Get user location to update car position on map
      let coords: { latitude: number; longitude: number } | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 30000,
          }),
        );
        coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      } catch {
        // Geolocation unavailable — continue without coords
      }

      return await rentalsApi.complete(rentalId, coords);
    },
    onSuccess: () => {
      // Clear current rental and refresh everything
      queryClient.setQueryData(rentalKeys.current(), null);
      queryClient.invalidateQueries({ queryKey: rentalKeys.history() });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};

export const useReportAccident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rentalId,
      description,
    }: {
      rentalId: string;
      description?: string;
    }) => {
      if (!USE_BACKEND) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { success: true, message: "Аварийная ситуация зарегистрирована" };
      }
      return await rentalsApi.reportAccident(rentalId, description);
    },
    onSuccess: () => {
      // Clear current rental and refresh everything
      queryClient.setQueryData(rentalKeys.current(), null);
      queryClient.invalidateQueries({ queryKey: rentalKeys.history() });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};
