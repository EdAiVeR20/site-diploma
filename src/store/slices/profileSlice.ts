import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { usersApi, verificationApi } from '../../api';
import type { User, VerificationStatus } from '../../types';

// DEV MODE: Use mock backend data (set false to use Telegram data directly)
const USE_BACKEND = false;

const MOCK_USER: User = {
    id: '1',
    telegramId: 123456789,
    firstName: 'Тест',
    lastName: 'Пользователь',
    username: 'testuser',
    balance: 1500,
    verificationStatus: 'none',
    hasActiveRental: false,
    createdAt: new Date().toISOString(),
};

interface VerificationFiles {
    passport: File | null;
    license: File | null;
    selfie: File | null;
}

interface VerificationPreviews {
    passport: string | null;
    license: string | null;
    selfie: string | null;
}

interface ProfileState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    verificationFiles: VerificationFiles;
    verificationPreviews: VerificationPreviews;
    isSubmittingVerification: boolean;
    verificationError: string | null;
}

const initialState: ProfileState = {
    user: null,
    isLoading: false,
    error: null,
    verificationFiles: {
        passport: null,
        license: null,
        selfie: null,
    },
    verificationPreviews: {
        passport: null,
        license: null,
        selfie: null,
    },
    isSubmittingVerification: false,
    verificationError: null,
};

// Async thunk for fetching user profile
export const fetchProfile = createAsyncThunk<
    User,
    { telegramUser?: { id: number; firstName: string; lastName?: string; username?: string } },
    { rejectValue: string }
>('profile/fetch', async ({ telegramUser }, { rejectWithValue }) => {
    // If we have Telegram user data, use it to create a profile
    if (telegramUser) {
        return {
            id: String(telegramUser.id),
            telegramId: telegramUser.id,
            firstName: telegramUser.firstName,
            lastName: telegramUser.lastName,
            username: telegramUser.username,
            balance: 0, // Will be fetched from backend later
            verificationStatus: 'none' as const,
            hasActiveRental: false,
            createdAt: new Date().toISOString(),
        };
    }

    // Try to fetch from backend
    if (USE_BACKEND) {
        try {
            const response = await usersApi.getProfile();
            return response;
        } catch {
            return rejectWithValue('Не удалось загрузить профиль');
        }
    }

    // Fallback to mock data
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_USER;
});

// Async thunk for submitting verification documents
export const submitVerification = createAsyncThunk<
    { status: VerificationStatus },
    { passport: File; license: File; selfie: File },
    { rejectValue: string }
>('profile/submitVerification', async ({ passport, license, selfie }, { rejectWithValue }) => {
    try {
        await verificationApi.uploadDocuments(passport, license, selfie);
        return { status: 'pending' as VerificationStatus };
    } catch {
        return rejectWithValue('Не удалось отправить документы');
    }
});

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        setVerificationFile: (
            state,
            action: PayloadAction<{ type: keyof VerificationFiles; file: File; preview: string }>
        ) => {
            state.verificationFiles[action.payload.type] = action.payload.file;
            state.verificationPreviews[action.payload.type] = action.payload.preview;
        },
        clearVerificationFiles: (state) => {
            state.verificationFiles = { passport: null, license: null, selfie: null };
            state.verificationPreviews = { passport: null, license: null, selfie: null };
        },
        clearProfileError: (state) => {
            state.error = null;
            state.verificationError = null;
        },
        updateUserBalance: (state, action: PayloadAction<number>) => {
            if (state.user) {
                state.user.balance = action.payload;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch profile
            .addCase(fetchProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
            })
            .addCase(fetchProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || 'Ошибка загрузки';
            })
            // Submit verification
            .addCase(submitVerification.pending, (state) => {
                state.isSubmittingVerification = true;
                state.verificationError = null;
            })
            .addCase(submitVerification.fulfilled, (state, action) => {
                state.isSubmittingVerification = false;
                if (state.user) {
                    state.user.verificationStatus = action.payload.status;
                }
                // Clear files after successful submission
                state.verificationFiles = { passport: null, license: null, selfie: null };
                state.verificationPreviews = { passport: null, license: null, selfie: null };
            })
            .addCase(submitVerification.rejected, (state, action) => {
                state.isSubmittingVerification = false;
                state.verificationError = action.payload || 'Ошибка отправки';
            });
    },
});

export const {
    setVerificationFile,
    clearVerificationFiles,
    clearProfileError,
    updateUserBalance,
} = profileSlice.actions;
export default profileSlice.reducer;
