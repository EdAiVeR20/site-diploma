import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../api';
import type { TelegramUser, AuthResponse } from '../../types';

// Set to true when backend is ready
const USE_BACKEND = false;

interface AuthState {
    isAuthenticated: boolean;
    isAuthenticating: boolean;
    userId: string | null;
    isVerified: boolean;
    balance: number;
    telegramUser: TelegramUser | null;
    error: string | null;
}

const initialState: AuthState = {
    isAuthenticated: false,
    isAuthenticating: true,
    userId: null,
    isVerified: false,
    balance: 0,
    telegramUser: null,
    error: null,
};

// Async thunk for Telegram authentication
export const loginWithTelegram = createAsyncThunk<
    AuthResponse,
    { telegramUser?: TelegramUser },
    { rejectValue: string; state: { auth: AuthState } }
>('auth/loginWithTelegram', async ({ telegramUser }, { rejectWithValue, getState }) => {
    const state = getState();
    const user = telegramUser || state.auth.telegramUser;

    // If no backend, return auth response based on Telegram data
    if (!USE_BACKEND) {
        if (user) {
            return {
                userId: String(user.id),
                isVerified: false,
                balance: 0,
                accessToken: 'mock-token',
            };
        }
        // No Telegram user - still allow for demo
        return {
            userId: 'demo',
            isVerified: false,
            balance: 0,
            accessToken: 'mock-token',
        };
    }

    // Use backend for authentication
    try {
        const response = await authApi.login();
        return response;
    } catch {
        return rejectWithValue('Ошибка авторизации через Telegram');
    }
});

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
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginWithTelegram.pending, (state) => {
                state.isAuthenticating = true;
                state.error = null;
            })
            .addCase(loginWithTelegram.fulfilled, (state, action) => {
                state.isAuthenticating = false;
                state.isAuthenticated = true;
                state.userId = action.payload.userId;
                state.isVerified = action.payload.isVerified;
                state.balance = action.payload.balance;
                state.error = null;
            })
            .addCase(loginWithTelegram.rejected, (state, action) => {
                state.isAuthenticating = false;
                state.error = action.payload || 'Ошибка авторизации';
            });
    },
});

export const { setTelegramUser, logout, updateBalance, setAuthenticating } = authSlice.actions;
export default authSlice.reducer;
