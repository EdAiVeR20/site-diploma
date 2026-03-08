import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../api';
import type { TelegramUser, AuthResponse } from '../../types';

interface AuthState {
    isAuthenticated: boolean;
    isAuthenticating: boolean;
    userId: string | null;
    isVerified: boolean;
    balance: number;
    phoneNumber: string | null;
    telegramUser: TelegramUser | null;
    error: string | null;
}

const initialState: AuthState = {
    isAuthenticated: false,
    isAuthenticating: true,
    userId: null,
    isVerified: false,
    balance: 0,
    phoneNumber: null,
    telegramUser: null,
    error: null,
};



const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setTelegramUser: (state, action: PayloadAction<TelegramUser>) => {
            state.telegramUser = action.payload;
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.userId = null;
            state.isVerified = false;
            state.balance = 0;
            authApi.logout();
        },
        updateBalance: (state, action: PayloadAction<number>) => {
            state.balance = action.payload;
        },
        setAuthenticating: (state, action: PayloadAction<boolean>) => {
            state.isAuthenticating = action.payload;
        },
        loginSuccess: (state, action: PayloadAction<AuthResponse>) => {
            state.isAuthenticating = false;
            state.isAuthenticated = true;
            state.userId = action.payload.userId;
            state.isVerified = action.payload.isVerified;
            state.balance = action.payload.balance;
            state.phoneNumber = action.payload.phoneNumber || null;
            state.error = null;
        },
        setPhoneNumber: (state, action: PayloadAction<string>) => {
            state.phoneNumber = action.payload;
        },
        loginFailure: (state, action: PayloadAction<string>) => {
            state.isAuthenticating = false;
            state.error = action.payload;
        },
    },
});

export const { setTelegramUser, logout, updateBalance, setAuthenticating, loginSuccess, loginFailure, setPhoneNumber } = authSlice.actions;
export default authSlice.reducer;
