import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { forumPeriod } from '../thunks/forumPeriod';

interface forumPeriodState {
    data: {
        forumPeriod: string[];
    };
    loading: boolean;
    error: string | null;
}

const initialState: forumPeriodState = {
    data: {
        forumPeriod: [],
    },
    loading: false,
    error: null,
};

const forumPeriodSlice = createSlice({
    name: 'forumPeriod',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(forumPeriod.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(
                forumPeriod.fulfilled,
                (state, action: PayloadAction<{ forumPeriod: string[] }>) => {
                    state.loading = false;
                    state.data = action.payload;
                },
            )
            .addCase(forumPeriod.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch repeat units';
            });
    },
});

export default forumPeriodSlice.reducer;
