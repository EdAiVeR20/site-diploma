// TypeScript declarations for Yandex Maps API 3.0 (ymaps3)

declare global {
    const ymaps3: {
        ready: Promise<void>;
        YMap: new (
            container: HTMLElement,
            props: {
                location: {
                    center: [number, number]; // [longitude, latitude]
                    zoom: number;
                };
            }
        ) => YMaps3MapInstance;
        YMapDefaultSchemeLayer: new () => YMaps3Child;
        YMapDefaultFeaturesLayer: new () => YMaps3Child;
        YMapControls: new (props: { position: string }) => YMaps3Child;
        YMapZoomControl: new () => YMaps3Child;
        YMapGeolocationControl: new () => YMaps3Child;
        YMapMarker: new (props: {
            coordinates: [number, number]; // [longitude, latitude]
            draggable?: boolean;
        }, element?: HTMLElement) => YMaps3Marker;
        YMapListener: new (props: {
            onClick?: (object: unknown, event: { coordinates: [number, number] }) => void;
        }) => YMaps3Child;
        import: (modules: string[]) => Promise<unknown>;
    };

    interface YMaps3MapInstance {
        addChild: (child: YMaps3Child | YMaps3Marker) => YMaps3MapInstance;
        removeChild: (child: YMaps3Child | YMaps3Marker) => YMaps3MapInstance;
        setLocation: (location: { center?: [number, number]; zoom?: number }, options?: { duration?: number }) => void;
        destroy: () => void;
    }

    interface YMaps3Child {
        addChild?: (child: YMaps3Child) => YMaps3Child;
    }

    interface YMaps3Marker {
        coordinates: [number, number];
        update: (props: { coordinates?: [number, number] }) => void;
    }
}

export { };
