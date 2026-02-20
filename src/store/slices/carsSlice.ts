import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { carsApi } from '../../api';
import type { Car } from '../../types';

interface CarsState {
    cars: Car[];
    selectedCar: Car | null;
    isLoading: boolean;
    error: string | null;
    /** True after first successful or failed load */
    hasInitiallyLoaded: boolean;
    retryCount: number;
}

const initialState: CarsState = {
    cars: [],
    selectedCar: null,
    isLoading: false,
    error: null,
    hasInitiallyLoaded: false,
    retryCount: 0,
};

// Async thunk for fetching available cars from backend
export const fetchAvailableCars = createAsyncThunk<
    Car[],
    { lat?: number; lon?: number; radius?: number },
    { rejectValue: string }
>('cars/fetchAvailable', async ({ lat, lon, radius }, { rejectWithValue }) => {
    try {
        const response = await carsApi.getAvailable(lat, lon, radius);
        return response.cars;
    } catch {
        return rejectWithValue('Не удалось загрузить список машин');
    }
});

const carsSlice = createSlice({
    name: 'cars',
    initialState,
    reducers: {
        selectCar: (state, action: PayloadAction<Car>) => {
            state.selectedCar = action.payload;
        },
        clearSelectedCar: (state) => {
            state.selectedCar = null;
        },
        clearCarsError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAvailableCars.pending, (state) => {
                state.isLoading = true;
                // Only clear error if we already have cars loaded (background refresh)
                if (state.cars.length > 0) {
                    state.error = null;
                }
            })
            .addCase(fetchAvailableCars.fulfilled, (state, action) => {
                state.isLoading = false;
                state.cars = action.payload;
                state.error = null;
                state.hasInitiallyLoaded = true;
                state.retryCount = 0;
            })
            .addCase(fetchAvailableCars.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Ошибка загрузки';
                state.hasInitiallyLoaded = true;
                state.retryCount += 1;
            });
    },
});

export const { selectCar, clearSelectedCar, clearCarsError } = carsSlice.actions;
export default carsSlice.reducer;
