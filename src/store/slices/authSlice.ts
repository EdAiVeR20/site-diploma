import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../api';
import type { TelegramUser, AuthResponse } from '../../types';

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
    void,
    { rejectValue: string }
>('auth/loginWithTelegram', async (_, { rejectWithValue }) => {
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
