import { useEffect, useRef, useCallback, useState } from 'react';
import type { Car } from '../types';
import '../types/ymaps.d.ts';

// Get API key from environment variable
const YANDEX_MAPS_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';

// Track if script is being loaded
let scriptLoadPromise: Promise<void> | null = null;

// Load Yandex Maps script dynamically (v2.1)
function loadYandexMapsScript(): Promise<void> {
    if (scriptLoadPromise) return scriptLoadPromise;

    scriptLoadPromise = new Promise((resolve, reject) => {
        // Check if already loaded
        if (typeof window.ymaps !== 'undefined') {
            resolve();
            return;
        }

        // Check for existing script
        const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
        if (existingScript) {
            // Wait for it to load with timeout (30 seconds)
            let attempts = 0;
            const maxAttempts = 300; // 30 seconds max
            const checkLoaded = setInterval(() => {
                attempts++;
                if (typeof window.ymaps !== 'undefined') {
                    clearInterval(checkLoaded);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkLoaded);
                    scriptLoadPromise = null;
                    reject(new Error('Existing script timeout'));
                }
            }, 100);
            return;
        }

        // Create and append script
        const script = document.createElement('script');
        // Use v2.1 API URL
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU`;
        script.async = true;

        // Timeout for script load (30 seconds for slow mobile networks)
        const loadTimeout = setTimeout(() => {
            scriptLoadPromise = null; // Allow retry
            reject(new Error('Timeout: скрипт не загрузился за 30 секунд'));
        }, 30000);

        script.onload = () => {
            clearTimeout(loadTimeout);
            resolve();
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
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const userMarkerRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial map setup
    useEffect(() => {
        let isMounted = true;

        const initMap = async () => {
            // Avoid double initialization
            if (mapRef.current) return;

            try {
                setIsLoading(true);
                setError(null);

                await loadYandexMapsScript();

                if (!isMounted) return;

                // Initialize map when ymaps is ready
                window.ymaps.ready(() => {
                    if (!isMounted || !mapContainerRef.current) return;

                    try {
                        // Default center (Moscow) - v2.1 uses [latitude, longitude]
                        const defaultCenter = [55.7558, 37.6173];
                        const center = userLocation
                            ? [userLocation.latitude, userLocation.longitude]
                            : defaultCenter;

                        const map = new window.ymaps.Map(mapContainerRef.current, {
                            center: center,
                            zoom: 14,
                            controls: [] // Remove all controls (zoom, etc.)
                        }, {
                            suppressMapOpenBlock: true, // Hide "Open in Maps" button
                            yandexMapDisablePoiInteractivity: true, // Disable POI clicks
                            showLinkOnMap: false // Hide extra links if possible
                        });

                        mapRef.current = map;
                        setIsLoading(false);

                        // Add markers
                        updateMarkers(map);

                        if (userLocation) {
                            updateUserMarker(map, userLocation);
                        }
                    } catch (err) {
                        console.error('Map creation error:', err);
                        setError(`Ошибка создания карты: ${err}`);
                        setIsLoading(false);
                    }
                });

            } catch (err) {
                if (!isMounted) return;
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                console.error('Failed to load Yandex Maps script:', err);
                setError(`Не удалось загрузить скрипт карты: ${errorMessage}`);
                setIsLoading(false);
            }
        };

        initMap();

        return () => {
            isMounted = false;
            if (mapRef.current) {
                mapRef.current.destroy();
                mapRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Helper to generate marker HTML
    const getMarkerHTML = (car: Car) => {
        const hourlyTariff = car.tariffs.find(t => t.type === 'hourly');
        const priceText = hourlyTariff ? `${hourlyTariff.pricePerUnit} ₽/час` : '';

        return `
            <div class="relative cursor-pointer group" style="width: 40px; height: 40px; transform: translate(-20px, -40px);">
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
                        <div class="w-full h-24 bg-gray-200 dark:bg-gray-700">
                            <img src="${car.imageUrl}" alt="${car.brand}" class="w-full h-full object-cover" onerror="this.style.display='none'"/>
                        </div>
                        <div class="p-2.5">
                            <p class="font-semibold text-gray-900 dark:text-white text-sm truncate">${car.brand} ${car.model}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">${car.licensePlate}</p>
                            <div class="flex items-center justify-between mt-1.5">
                                <span class="text-xs font-medium text-violet-600 dark:text-violet-400">${priceText}</span>
                                <span class="text-xs text-gray-400">⛽ ${car.fuelLevel}%</span>
                            </div>
                        </div>
                    </div>
                     <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white dark:border-t-gray-800"></div>
                </div>
            </div>
        `;
    };

    // Update markers
    const updateMarkers = useCallback((map: any) => {
        if (!window.ymaps) return;

        // Clear old markers
        markersRef.current.forEach(marker => map.geoObjects.remove(marker));
        markersRef.current = [];

        cars.forEach(car => {
            // Create custom layout
            const LayoutClass = window.ymaps.templateLayoutFactory.createClass(getMarkerHTML(car));

            const placemark = new window.ymaps.Placemark(
                [car.latitude, car.longitude], // v2.1 uses [lat, lng]
                {},
                {
                    iconLayout: LayoutClass,
                    iconShape: {
                        type: 'Rectangle',
                        coordinates: [[-20, -40], [20, 0]]
                    }
                }
            );

            // Add click listener
            placemark.events.add('click', () => {
                onCarSelect?.(car);
            });

            map.geoObjects.add(placemark);
            markersRef.current.push(placemark);
        });
    }, [cars, onCarSelect]);

    // Update user marker
    const updateUserMarker = useCallback((map: any, location: { latitude: number; longitude: number }) => {
        if (!window.ymaps) return;

        if (userMarkerRef.current) {
            map.geoObjects.remove(userMarkerRef.current);
        }

        const userHtml = `
            <div class="relative" style="transform: translate(-12px, -12px);">
                <div class="w-6 h-6 bg-blue-500 rounded-full shadow-lg border-3 border-white animate-pulse"></div>
                <div class="absolute inset-0 w-6 h-6 bg-blue-500/30 rounded-full animate-ping"></div>
            </div>
        `;

        const LayoutClass = window.ymaps.templateLayoutFactory.createClass(userHtml);

        const placemark = new window.ymaps.Placemark(
            [location.latitude, location.longitude],
            {},
            {
                iconLayout: LayoutClass
            }
        );

        map.geoObjects.add(placemark);
        userMarkerRef.current = placemark;
    }, []);

    // Effect to update markers when cars change
    useEffect(() => {
        if (mapRef.current) {
            updateMarkers(mapRef.current);
        }
    }, [cars, updateMarkers]);

    // Effect to update user location
    useEffect(() => {
        if (mapRef.current && userLocation) {
            updateUserMarker(mapRef.current, userLocation);
            mapRef.current.panTo([userLocation.latitude, userLocation.longitude], {
                delay: 0,
                duration: 500
            });
        }
    }, [userLocation, updateUserMarker]);

    return (
        <div className={`relative w-full h-full ${className}`} style={{ minHeight: '200px' }}>
            {/* Loading state */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Загрузка карты (v2.1)...</span>
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

