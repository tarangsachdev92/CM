import { createSlice } from '@reduxjs/toolkit';
import { editForum } from '../thunks/editForum';

interface ForumState {
    loading: boolean;
    error: string | null;
    success: boolean;
}

const initialState: ForumState = {
    loading: false,
    error: null,
    success: false,
};

const editNewForumsSlice = createSlice({
    name: 'editNewForums',
    initialState,
    reducers: {
    },
    extraReducers: builder => {
            builder
                .addCase(editForum.pending, state => {
                    state.loading = true;
                    state.error = null;
                    state.success = false;
                })
    
                .addCase(editForum.fulfilled, (state, action) => {
                    state.loading = false;
                    if (action.payload?.statusCode === 200) {
                        state.success = true;
                    }
                })
    
                .addCase(editForum.rejected, (state, action) => {
                    state.loading = false;
                    state.success = false;
                    state.error = (action.payload as string) || 'Failed to update forum';
                });
        },
});

export default editNewForumsSlice.reducer;