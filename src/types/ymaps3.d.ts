// TypeScript declarations for Yandex Maps API 3.0

declare global {
    const ymaps3: {
        ready: Promise<void>;
        import: (module: string) => Promise<unknown>;
        strictMode: boolean;
        YMap: typeof YMap;
        YMapDefaultSchemeLayer: typeof YMapDefaultSchemeLayer;
        YMapDefaultFeaturesLayer: typeof YMapDefaultFeaturesLayer;
        YMapMarker: typeof YMapMarker;
        YMapControls: typeof YMapControls;
        YMapZoomControl: typeof YMapZoomControl;
        YMapGeolocationControl: typeof YMapGeolocationControl;
    };

    class YMap {
        constructor(
            container: HTMLElement,
            options: {
                location: {
                    center: [number, number];
                    zoom: number;
                };
                behaviors?: string[];
            }
        );
        addChild(child: unknown): void;
        removeChild(child: unknown): void;
        update(options: { location: { center: [number, number]; zoom?: number } }): void;
        destroy(): void;
    }

    class YMapDefaultSchemeLayer {
        constructor(options?: { theme?: 'light' | 'dark' });
    }

    class YMapDefaultFeaturesLayer {
        constructor();
    }

    class YMapMarker {
        constructor(
            options: {
                coordinates: [number, number];
                draggable?: boolean;
            },
            element: HTMLElement
        );
    }

    class YMapControls {
        constructor(options: { position: string });
        addChild(child: unknown): void;
    }

    class YMapZoomControl {
        constructor();
    }

    class YMapGeolocationControl {
        constructor();
    }
}

export { };
