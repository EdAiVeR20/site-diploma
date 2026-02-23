export { };

declare global {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ymaps3 is loaded from external script, no precise type available
    const ymaps3: any;

    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ymaps3: any;
    }
}
