import { useQuery } from "@tanstack/react-query";
import { carsApi } from "../../api";

interface UseAvailableCarsProps {
  lat?: number;
  lon?: number;
  radius?: number;
}

export const useAvailableCars = ({
  lat,
  lon,
  radius = 5,
}: UseAvailableCarsProps) => {
  return useQuery({
    // Include lat and lon in the queryKey so it refetches when the user moves
    queryKey: ["cars", "available", lat, lon, radius],
    queryFn: async () => {
      const response = await carsApi.getAvailable(lat, lon, radius);
      return response.cars;
    },
    // Only run the query if coordinates are available (unless you want to fetch all by default)
    enabled: lat !== undefined && lon !== undefined,
    // Auto-refresh every 30 seconds
    refetchInterval: 30000,
    // Keep previous data on screen while fetching new data
    placeholderData: (previousData) => previousData,
    // Retry with exponential backoff if Server Error
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Fetch detailed car info (tech specs, last service, etc.) by ID.
 * Only runs when carId is provided (i.e., when the drawer opens).
 */
export const useCarDetails = (carId?: string) => {
  return useQuery({
    queryKey: ["cars", "details", carId],
    queryFn: () => carsApi.getById(carId!),
    enabled: !!carId,
    staleTime: 5 * 60 * 1000, // 5 min — specs don't change often
    retry: 1,
  });
};
