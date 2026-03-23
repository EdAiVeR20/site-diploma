import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Car } from "../../types";

interface CarsState {
  selectedCar: Car | null;
}

const initialState: CarsState = {
  selectedCar: null,
};

const carsSlice = createSlice({
  name: "cars",
  initialState,
  reducers: {
    selectCar: (state, action: PayloadAction<Car>) => {
      state.selectedCar = action.payload;
    },
    clearSelectedCar: (state) => {
      state.selectedCar = null;
    },
  },
});

export const { selectCar, clearSelectedCar } = carsSlice.actions;
export default carsSlice.reducer;
