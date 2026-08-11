import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { forumLevel } from '../thunks/forumLevel';

interface forumLevelState {
    data: {
        forumLevel: string[];
    };
    loading: boolean;
    error: string | null;
}

const initialState: forumLevelState = {
    data: {
        forumLevel: [],
    },
    loading: false,
    error: null,
};

const forumLevelSlice = createSlice({
    name: 'forumLevel',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(forumLevel.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(
                forumLevel.fulfilled,
                (state, action: PayloadAction<{ forumLevel: string[] }>) => {
                    state.loading = false;
                    state.data = action.payload;
                },
            )
            .addCase(forumLevel.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch repeat units';
            });
    },
});

export default forumLevelSlice.reducer;
