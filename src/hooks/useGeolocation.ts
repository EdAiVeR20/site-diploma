import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    loading: boolean;
    error: string | null;
}

interface UseGeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    watch?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}): GeolocationState & { refresh: () => void } {
    const {
        enableHighAccuracy = true,
        timeout = 10000,
        maximumAge = 60000,
        watch = false,
    } = options;

    const [state, setState] = useState<GeolocationState>({
        latitude: null,
        longitude: null,
        accuracy: null,
        loading: true,
        error: null,
    });

    const handleSuccess = useCallback((position: GeolocationPosition) => {
        setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            loading: false,
            error: null,
        });
    }, []);

    const handleError = useCallback((error: GeolocationPositionError) => {
        let errorMessage = 'Не удалось определить местоположение';

        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Доступ к геолокации запрещён';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Местоположение недоступно';
                break;
            case error.TIMEOUT:
                errorMessage = 'Превышено время ожидания';
                break;
        }

        setState((prev) => ({
            ...prev,
            loading: false,
            error: errorMessage,
        }));
    }, []);

    const getPosition = useCallback(() => {
        if (!navigator.geolocation) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: 'Геолокация не поддерживается браузером',
            }));
            return;
        }

        setState((prev) => ({ ...prev, loading: true, error: null }));

        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
            enableHighAccuracy,
            timeout,
            maximumAge,
        });
    }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

    useEffect(() => {
        getPosition();

        if (watch && navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
                enableHighAccuracy,
                timeout,
                maximumAge,
            });

            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [watch, enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError, getPosition]);

    return { ...state, refresh: getPosition };
}
