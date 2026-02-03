import { useEffect, useRef, useCallback, useState } from 'react';
import type { Car } from '../types';
import '../types/ymaps.d.ts';

// Get API key from environment variable
const YANDEX_MAPS_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';

// Track if script is being loaded
let scriptLoadPromise: Promise<void> | null = null;

// Load Yandex Maps script dynamically
function loadYandexMapsScript(): Promise<void> {
    if (scriptLoadPromise) return scriptLoadPromise;

    scriptLoadPromise = new Promise((resolve, reject) => {
        // Check if already loaded
        if (typeof ymaps3 !== 'undefined') {
            resolve();
            return;
        }

        // Check for existing script
        const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
        if (existingScript) {
            // Wait for it to load with timeout
            let attempts = 0;
            const maxAttempts = 100; // 10 seconds max
            const checkLoaded = setInterval(() => {
                attempts++;
                if (typeof ymaps3 !== 'undefined') {
                    clearInterval(checkLoaded);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkLoaded);
                    reject(new Error('Yandex Maps script load timeout'));
                }
            }, 100);
            return;
        }

        // Create and append script
        const script = document.createElement('script');
        // Use the correct v3 API URL
        script.src = `https://api-maps.yandex.ru/v3/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU`;
        script.async = true;
        script.crossOrigin = 'anonymous';

        // Timeout for script load
        const loadTimeout = setTimeout(() => {
            scriptLoadPromise = null; // Allow retry
            reject(new Error('Timeout: скрипт не загрузился за 15 секунд'));
        }, 15000);

        script.onload = () => {
            // Wait for ymaps3 to be defined with timeout
            let attempts = 0;
            const maxAttempts = 100;
            const checkReady = setInterval(() => {
                attempts++;
                if (typeof ymaps3 !== 'undefined') {
                    clearInterval(checkReady);
                    clearTimeout(loadTimeout);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkReady);
                    clearTimeout(loadTimeout);
                    scriptLoadPromise = null; // Allow retry
                    reject(new Error('API загружен, но ymaps3 не определён'));
                }
            }, 50);
        };

        script.onerror = (event) => {
            clearTimeout(loadTimeout);
            scriptLoadPromise = null; // Allow retry
            const errorDetails = event instanceof ErrorEvent ? event.message : 'network error';
            reject(new Error(`Ошибка загрузки скрипта: ${errorDetails}`));
        };

        document.head.appendChild(script);
    });

    return scriptLoadPromise;
}

interface YandexMapProps {
    cars: Car[];
    userLocation?: {
        latitude: number;
        longitude: number;
    };
    onCarSelect?: (car: Car) => void;
    className?: string;
}

export function YandexMap({ cars, userLocation, onCarSelect, className = '' }: YandexMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<YMaps3MapInstance | null>(null);
    const markersRef = useRef<YMaps3Marker[]>([]);
    const userMarkerRef = useRef<YMaps3Marker | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Wait for ymaps3 to be loaded
    const waitForYmaps3 = useCallback((): Promise<void> => {
        return loadYandexMapsScript().then(() => {
            // Check if ymaps3 is ready
            if (typeof ymaps3 !== 'undefined' && 'ready' in ymaps3) {
                return Promise.resolve();
            }
            return Promise.reject(new Error('Yandex Maps API failed to initialize'));
        });
    }, []);

    // Create car marker element with hover popup
    const createCarMarkerElement = useCallback((car: Car): HTMLElement => {
        const element = document.createElement('div');
        element.className = 'car-marker';

        // Get the first tariff price for display
        const hourlyTariff = car.tariffs.find(t => t.type === 'hourly');
        const priceText = hourlyTariff ? `${hourlyTariff.pricePerUnit} ₽/час` : '';

        element.innerHTML = `
            <div class="relative cursor-pointer group">
                <!-- Car marker icon -->
                <div class="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full shadow-lg flex items-center justify-center border-2 border-white transform group-hover:scale-110 transition-transform">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                    </svg>
                </div>
                <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-transparent border-t-purple-600"></div>
                
                <!-- Hover popup -->
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden w-48">
                        <!-- Car image -->
                        <div class="w-full h-24 bg-gray-200 dark:bg-gray-700">
                            <img src="${car.imageUrl}" alt="${car.brand} ${car.model}" class="w-full h-full object-cover" onerror="this.style.display='none'"/>
                        </div>
                        <!-- Car info -->
                        <div class="p-2.5">
                            <p class="font-semibold text-gray-900 dark:text-white text-sm truncate">${car.brand} ${car.model}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${car.licensePlate}</p>
                            <div class="flex items-center justify-between mt-1.5">
                                <span class="text-xs font-medium text-violet-600 dark:text-violet-400">${priceText}</span>
                                <span class="text-xs text-gray-400">⛽ ${car.fuelLevel}%</span>
                            </div>
                        </div>
                    </div>
                    <!-- Arrow pointing down -->
                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white dark:border-t-gray-800"></div>
                </div>
            </div>
        `;

        element.onclick = () => {
            onCarSelect?.(car);
        };

        return element;
    }, [onCarSelect]);

    // Create user marker element
    const createUserMarkerElement = useCallback((): HTMLElement => {
        const element = document.createElement('div');
        element.className = 'user-marker';
        element.innerHTML = `
            <div class="relative">
                <div class="w-6 h-6 bg-blue-500 rounded-full shadow-lg border-3 border-white animate-pulse"></div>
                <div class="absolute inset-0 w-6 h-6 bg-blue-500/30 rounded-full animate-ping"></div>
            </div>
        `;
        return element;
    }, []);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        const initMap = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Wait for script to load
                await waitForYmaps3();

                // Wait for API to be ready
                await ymaps3.ready;

                if (!mapContainerRef.current) return;

                // Default center (Moscow) - note: v3 uses [longitude, latitude]
                const defaultCenter: [number, number] = [37.6173, 55.7558];
                const center: [number, number] = userLocation
                    ? [userLocation.longitude, userLocation.latitude]
                    : defaultCenter;

                // Create map
                const map = new ymaps3.YMap(mapContainerRef.current, {
                    location: {
                        center,
                        zoom: 15, // Increased zoom for better view of nearby cars
                    },
                });

                // Add default scheme layer
                map.addChild(new ymaps3.YMapDefaultSchemeLayer());

                // Add features layer for markers
                map.addChild(new ymaps3.YMapDefaultFeaturesLayer());

                mapRef.current = map;
                setIsLoading(false);

                // Add markers after map is ready
                addCarMarkers(map);
                if (userLocation) {
                    addUserMarker(map, userLocation);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                console.error('Failed to initialize Yandex Map:', err);
                setError(`Не удалось загрузить карту: ${errorMessage}`);
                setIsLoading(false);
            }
        };

        initMap();

        // Cleanup
        return () => {
            if (mapRef.current) {
                mapRef.current.destroy();
                mapRef.current = null;
            }
            markersRef.current = [];
            userMarkerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Add car markers
    const addCarMarkers = useCallback((map: YMaps3MapInstance) => {
        // Remove old markers
        markersRef.current.forEach(marker => {
            try {
                map.removeChild(marker);
            } catch {
                // Marker might already be removed
            }
        });
        markersRef.current = [];

        // Add new markers - note: v3 uses [longitude, latitude]
        cars.forEach((car) => {
            const element = createCarMarkerElement(car);
            const marker = new ymaps3.YMapMarker(
                {
                    coordinates: [car.longitude, car.latitude],
                },
                element
            );

            map.addChild(marker);
            markersRef.current.push(marker);
        });
    }, [cars, createCarMarkerElement]);

    // Add user location marker
    const addUserMarker = useCallback((map: YMaps3MapInstance, location: { latitude: number; longitude: number }) => {
        // Remove old user marker
        if (userMarkerRef.current) {
            try {
                map.removeChild(userMarkerRef.current);
            } catch {
                // Marker might already be removed
            }
        }

        // Add user marker - note: v3 uses [longitude, latitude]
        const element = createUserMarkerElement();
        const marker = new ymaps3.YMapMarker(
            {
                coordinates: [location.longitude, location.latitude],
            },
            element
        );

        map.addChild(marker);
        userMarkerRef.current = marker;
    }, [createUserMarkerElement]);

    // Update markers when cars change
    useEffect(() => {
        if (!mapRef.current) return;
        addCarMarkers(mapRef.current);
    }, [cars, addCarMarkers]);

    // Update user marker and center map when location changes
    useEffect(() => {
        if (!mapRef.current || !userLocation) return;

        addUserMarker(mapRef.current, userLocation);
        mapRef.current.setLocation(
            { center: [userLocation.longitude, userLocation.latitude] },
            { duration: 500 }
        );
    }, [userLocation, addUserMarker]);

    return (
        <div className={`relative w-full h-full ${className}`} style={{ minHeight: '200px' }}>
            {/* Loading state */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Загрузка карты...</span>
                    </div>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                    <div className="flex flex-col items-center gap-2 text-center p-4">
                        <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{error}</span>
                    </div>
                </div>
            )}

            {/* Map container */}
            <div
                ref={mapContainerRef}
                className="w-full h-full"
            />
        </div>
    );
}
