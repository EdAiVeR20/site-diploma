import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { rentalsApi } from '../../api';
import type { Rental, RentalResponse, CompleteRentalResponse, Tariff } from '../../types';

// DEV MODE: Mock rental history for development (keep true until backend is ready)
const DEV_MODE = true;

const MOCK_RENTAL_HISTORY: Rental[] = [
    {
        id: 'rental-1',
        car: {
            id: 'car-1',
            brand: 'Kia',
            model: 'Rio',
            imageUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=250&fit=crop',
        },
        tariff: {
            name: 'Почасовой',
            type: 'hourly',
            pricePerUnit: 450,
        },
        status: 'completed',
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        duration: 180, // 3 hours in minutes
        totalCost: 1350,
    },
    {
        id: 'rental-2',
        car: {
            id: 'car-2',
            brand: 'Hyundai',
            model: 'Solaris',
            imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=250&fit=crop',
        },
        tariff: {
            name: 'Суточный',
            type: 'daily',
            pricePerUnit: 2300,
        },
        status: 'completed',
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 1440, // 1 day in minutes
        totalCost: 2300,
    },
    {
        id: 'rental-3',
        car: {
            id: 'car-3',
            brand: 'Volkswagen',
            model: 'Polo',
            imageUrl: 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=400&h=250&fit=crop',
        },
        tariff: {
            name: 'Почасовой',
            type: 'hourly',
            pricePerUnit: 390,
        },
        status: 'completed',
        startTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
        duration: 300, // 5 hours
        totalCost: 1950,
    },
    {
        id: 'rental-4',
        car: {
            id: 'car-4',
            brand: 'BMW',
            model: 'X3',
            imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=250&fit=crop',
        },
        tariff: {
            name: 'Суточный',
            type: 'daily',
            pricePerUnit: 2700,
        },
        status: 'completed',
        startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 2880, // 2 days
        totalCost: 5400,
    },
];

interface RentalsState {
    history: Rental[];
    currentRental: RentalResponse | null;
    selectedTariff: Tariff | null;
    isLoading: boolean;
    isCreating: boolean;
    isCompleting: boolean;
    error: string | null;
}

const initialState: RentalsState = {
    history: [],
    currentRental: null,
    selectedTariff: null,
    isLoading: false,
    isCreating: false,
    isCompleting: false,
    error: null,
};

// Async thunk for fetching rental history
export const fetchRentalHistory = createAsyncThunk<
    Rental[],
    void,
    { rejectValue: string }
>('rentals/fetchHistory', async (_, { rejectWithValue }) => {
    // DEV MODE: Return mock data
    if (DEV_MODE) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return MOCK_RENTAL_HISTORY;
    }

    try {
        const response = await rentalsApi.getHistory();
        return response.rentals;
    } catch {
        return rejectWithValue('Не удалось загрузить историю поездок');
    }
});

// Async thunk for creating a rental
export const createRental = createAsyncThunk<
    RentalResponse,
    { carId: string; tariffId: string },
    { rejectValue: string }
>('rentals/create', async ({ carId, tariffId }, { rejectWithValue }) => {
    // DEV MODE: Simulate rental creation
    if (DEV_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockResponse: RentalResponse = {
            rentalId: `rental-${Date.now()}`,
            status: 'active',
            car: { brand: 'Test', model: 'Car' },
            tariff: { name: 'Почасовой', pricePerUnit: 450 },
            startTime: new Date().toISOString(),
            estimatedCost: 450,
        };
        return mockResponse;
    }

    try {
        const response = await rentalsApi.create({ carId, tariffId });
        return response;
    } catch {
        return rejectWithValue('Не удалось оформить аренду');
    }
});

// Async thunk for fetching current rental
export const fetchCurrentRental = createAsyncThunk<
    RentalResponse | null,
    void,
    { rejectValue: string }
>('rentals/fetchCurrent', async (_, { rejectWithValue }) => {
    // DEV MODE: No current rental
    if (DEV_MODE) {
        return null;
    }

    try {
        const response = await rentalsApi.getCurrent();
        return response;
    } catch {
        return rejectWithValue('Не удалось получить текущую аренду');
    }
});

// Async thunk for completing a rental
export const completeRental = createAsyncThunk<
    CompleteRentalResponse,
    { rentalId: string; endLatitude: number; endLongitude: number },
    { rejectValue: string }
>('rentals/complete', async ({ rentalId, endLatitude, endLongitude }, { rejectWithValue }) => {
    // DEV MODE: Simulate completion
    if (DEV_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockResponse: CompleteRentalResponse = {
            rentalId,
            status: 'completed',
            duration: 120, // 2 hours
            totalCost: 900,
            newBalance: 5000,
        };
        return mockResponse;
    }

    try {
        const response = await rentalsApi.complete(rentalId, { endLatitude, endLongitude });
        return response;
    } catch {
        return rejectWithValue('Не удалось завершить аренду');
    }
});

const rentalsSlice = createSlice({
    name: 'rentals',
    initialState,
    reducers: {
        selectTariff: (state, action: PayloadAction<Tariff>) => {
            state.selectedTariff = action.payload;
        },
        clearSelectedTariff: (state) => {
            state.selectedTariff = null;
        },
        clearRentalsError: (state) => {
            state.error = null;
        },
        clearCurrentRental: (state) => {
            state.currentRental = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch history
            .addCase(fetchRentalHistory.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchRentalHistory.fulfilled, (state, action) => {
                state.isLoading = false;
                state.history = action.payload;
            })
            .addCase(fetchRentalHistory.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Ошибка загрузки';
            })
            // Create rental
            .addCase(createRental.pending, (state) => {
                state.isCreating = true;
                state.error = null;
            })
            .addCase(createRental.fulfilled, (state, action) => {
                state.isCreating = false;
                state.currentRental = action.payload;
            })
            .addCase(createRental.rejected, (state, action) => {
                state.isCreating = false;
                state.error = action.payload || 'Ошибка создания';
            })
            // Fetch current rental
            .addCase(fetchCurrentRental.fulfilled, (state, action) => {
                state.currentRental = action.payload;
            })
            // Complete rental
            .addCase(completeRental.pending, (state) => {
                state.isCompleting = true;
                state.error = null;
            })
            .addCase(completeRental.fulfilled, (state) => {
                state.isCompleting = false;
                state.currentRental = null;
            })
            .addCase(completeRental.rejected, (state, action) => {
                state.isCompleting = false;
                state.error = action.payload || 'Ошибка завершения';
            });
    },
});

export const { selectTariff, clearSelectedTariff, clearRentalsError, clearCurrentRental } = rentalsSlice.actions;
export default rentalsSlice.reducer;
