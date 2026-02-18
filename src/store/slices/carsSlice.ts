import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { carsApi } from '../../api';
import type { Car } from '../../types';

interface CarsState {
    cars: Car[];
    selectedCar: Car | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: CarsState = {
    cars: [],
    selectedCar: null,
    isLoading: false,
    error: null,
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
                state.error = null;
            })
            .addCase(fetchAvailableCars.fulfilled, (state, action) => {
                state.isLoading = false;
                state.cars = action.payload;
                state.error = null;
            })
            .addCase(fetchAvailableCars.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Ошибка загрузки';
            });
    },
});

export const { selectCar, clearSelectedCar, clearCarsError } = carsSlice.actions;
export default carsSlice.reducer;
