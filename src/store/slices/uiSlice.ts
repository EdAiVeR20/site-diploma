import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type Tab = "home" | "history" | "profile";
type Screen = "main" | "rental" | "verification";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isLoading: boolean;
  error: string | null;
}

interface UiState {
  activeTab: Tab;
  currentScreen: Screen;
  geolocation: GeolocationState;
  isTelegramReady: boolean;
  colorScheme: "light" | "dark";
  viewportHeight: number;
}

const initialState: UiState = {
  activeTab: "home",
  currentScreen: "main",
  geolocation: {
    latitude: null,
    longitude: null,
    accuracy: null,
    isLoading: true,
    error: null,
  },
  isTelegramReady: false,
  colorScheme: "light",
  viewportHeight: typeof window !== "undefined" ? window.innerHeight : 800,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<Tab>) => {
      state.activeTab = action.payload;
      state.currentScreen = "main";
    },
    setCurrentScreen: (state, action: PayloadAction<Screen>) => {
      state.currentScreen = action.payload;
    },
    navigateToRental: (state) => {
      state.currentScreen = "rental";
    },
    navigateToVerification: (state) => {
      state.currentScreen = "verification";
    },
    navigateToMain: (state) => {
      state.currentScreen = "main";
    },
    setGeolocation: (
      state,
      action: PayloadAction<{
        latitude: number;
        longitude: number;
        accuracy: number;
      }>,
    ) => {
      state.geolocation.latitude = action.payload.latitude;
      state.geolocation.longitude = action.payload.longitude;
      state.geolocation.accuracy = action.payload.accuracy;
      state.geolocation.isLoading = false;
      state.geolocation.error = null;
    },
    setGeolocationError: (state, action: PayloadAction<string>) => {
      state.geolocation.isLoading = false;
      state.geolocation.error = action.payload;
    },
    setGeolocationLoading: (state, action: PayloadAction<boolean>) => {
      state.geolocation.isLoading = action.payload;
    },
    setTelegramReady: (state, action: PayloadAction<boolean>) => {
      state.isTelegramReady = action.payload;
    },
    setColorScheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.colorScheme = action.payload;
    },
    setViewportHeight: (state, action: PayloadAction<number>) => {
      state.viewportHeight = action.payload;
    },
  },
});

export const {
  setActiveTab,
  setCurrentScreen,
  navigateToRental,
  navigateToVerification,
  navigateToMain,
  setGeolocation,
  setGeolocationError,
  setGeolocationLoading,
  setTelegramReady,
  setColorScheme,
  setViewportHeight,
} = uiSlice.actions;
export default uiSlice.reducer;
