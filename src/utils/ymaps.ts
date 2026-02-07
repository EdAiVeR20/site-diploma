import React from 'react';
import ReactDOM from 'react-dom';

// Wait for Yandex Maps API to load and import the reactify module
// @ts-ignore - ymaps3 is global
const [ymaps3React] = await Promise.all([
    ymaps3.import('@yandex/ymaps3-reactify'),
    ymaps3.ready
]);

export const reactify = ymaps3React.reactify.bindTo(React, ReactDOM);
export const {
    YMap,
    YMapDefaultSchemeLayer,
    YMapDefaultFeaturesLayer,
    YMapMarker,
    YMapControls,
    YMapControl
} = reactify.module(ymaps3);
