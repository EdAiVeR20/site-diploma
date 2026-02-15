import { useEffect, useRef } from 'react';
import { useAppDispatch } from '../store';
import { setGeolocation, setGeolocationError, setGeolocationLoading } from '../store/slices/uiSlice';

/**
 * App-level geolocation hook. Call once in App (always mounted).
 * Uses watchPosition for continuous background updates.
 * Dispatches to Redux — all components read from store.
 */
export function useGeolocation() {
    const dispatch = useAppDispatch();
    const watchIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            dispatch(setGeolocationError('Геолокация не поддерживается браузером'));
            dispatch(setGeolocationLoading(false));
            return;
        }

        dispatch(setGeolocationLoading(true));

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                dispatch(setGeolocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                }));
            },
            (err) => {
                let errorMessage = 'Не удалось определить местоположение';
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = 'Доступ к геолокации запрещён';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = 'Местоположение недоступно';
                        break;
                    case err.TIMEOUT:
                        errorMessage = 'Превышено время ожидания';
                        break;
                }
                dispatch(setGeolocationError(errorMessage));
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [dispatch]);
}
