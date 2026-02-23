import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Tariff } from '../../types';

interface RentalsState {
    selectedTariff: Tariff | null;
}

const initialState: RentalsState = {
    selectedTariff: null,
};



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
    },
});

export const { selectTariff, clearSelectedTariff } = rentalsSlice.actions;
export default rentalsSlice.reducer;
