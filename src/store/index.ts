import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';

// Import slices
import authReducer from './slices/authSlice';
import carsReducer from './slices/carsSlice';
import rentalsReducer from './slices/rentalsSlice';
import profileReducer from './slices/profileSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        cars: carsReducer,
        rentals: rentalsReducer,
        profile: profileReducer,
        ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore non-serializable File objects in verification
                ignoredActions: ['profile/setVerificationFiles'],
                ignoredPaths: ['profile.verificationFiles'],
            },
        }),
});

// Infer types from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for use throughout the app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
