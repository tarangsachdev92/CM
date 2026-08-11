import { createSlice } from '@reduxjs/toolkit';
import { addNewForum, editForumDetails } from '../thunks/addNewForum';

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

const forumSlice = createSlice({
    name: 'forum',
    initialState,
    reducers: {
        resetForumState: state => {
            state.loading = false;
            state.error = null;
            state.success = false;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(addNewForum.pending, state => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(addNewForum.fulfilled, state => {
                state.loading = false;
                state.success = true;
            })
            .addCase(addNewForum.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(editForumDetails.pending, state => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(editForumDetails.fulfilled, state => {
                state.loading = false;
                state.success = true;
            })
            .addCase(editForumDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { resetForumState } = forumSlice.actions;
export default forumSlice.reducer;
