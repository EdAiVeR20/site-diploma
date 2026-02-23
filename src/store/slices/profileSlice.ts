import { createSlice } from '@reduxjs/toolkit';

// profileSlice state is completely migrated to React Query.
// We keep an empty slice just in case we need local profile UI state later.
type ProfileState = Record<string, never>;

const initialState: ProfileState = {};

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {},
});

export default profileSlice.reducer;
