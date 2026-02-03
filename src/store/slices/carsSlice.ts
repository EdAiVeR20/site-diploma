import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { carsApi } from '../../api';
import type { Car } from '../../types';

// DEV MODE: Mock cars for development without backend
const DEV_MODE = true;

// Generate mock cars around a location
const generateMockCarsAroundLocation = (lat: number, lon: number): Car[] => {
    // Generate random offset in meters, convert to degrees
    const metersToDegreesLat = (m: number) => m / 111320;
    const metersToDegreesLon = (m: number, latitude: number) => m / (111320 * Math.cos(latitude * Math.PI / 180));

    const carModels = [
        { brand: 'Kia', model: 'Rio', image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400&h=250&fit=crop' },
        { brand: 'Hyundai', model: 'Solaris', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=250&fit=crop' },
        { brand: 'Volkswagen', model: 'Polo', image: 'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?w=400&h=250&fit=crop' },
        { brand: 'Skoda', model: 'Rapid', image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=250&fit=crop' },
        { brand: 'Toyota', model: 'Camry', image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=250&fit=crop' },
        { brand: 'BMW', model: 'X3', image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=250&fit=crop' },
    ];

    const plates = ['А123БВ77', 'В456ГД99', 'Е789ЖЗ150', 'К012МН177', 'О345ПР97', 'С678ТУ199'];

    return carModels.map((car, index) => {
        // Random offset: 100-800 meters from user
        const distance = 100 + Math.random() * 700;
        const angle = (index * 60 + Math.random() * 30) * Math.PI / 180; // Spread cars around

        const offsetLat = metersToDegreesLat(distance * Math.cos(angle));
        const offsetLon = metersToDegreesLon(distance * Math.sin(angle), lat);

        return {
            id: `car-${index + 1}`,
            brand: car.brand,
            model: car.model,
            licensePlate: plates[index % plates.length],
            fuelLevel: 40 + Math.floor(Math.random() * 60),
            latitude: lat + offsetLat,
            longitude: lon + offsetLon,
            imageUrl: car.image,
            tariffs: [
                { id: `t${index * 2 + 1}`, name: 'Почасовой', type: 'hourly' as const, pricePerUnit: 350 + Math.floor(Math.random() * 200) },
                { id: `t${index * 2 + 2}`, name: 'Суточный', type: 'daily' as const, pricePerUnit: 2000 + Math.floor(Math.random() * 1000) },
            ],
        };
    });
};

// Default Moscow coordinates for fallback
const DEFAULT_LAT = 55.7558;
const DEFAULT_LON = 37.6173;

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

// Async thunk for fetching available cars
export const fetchAvailableCars = createAsyncThunk<
    Car[],
    { lat?: number; lon?: number; radius?: number },
    { rejectValue: string }
>('cars/fetchAvailable', async ({ lat, lon, radius }, { rejectWithValue }) => {
    // DEV MODE: Return mock data around user location
    if (DEV_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        const userLat = lat ?? DEFAULT_LAT;
        const userLon = lon ?? DEFAULT_LON;
        return generateMockCarsAroundLocation(userLat, userLon);
    }

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
