import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { deleteForum } from '../thunks/deleteForum';

interface IForumState {
    delete: {
        isLoading: boolean;
        isSuccess: boolean;
        error: string | null;
    };
}

const initialState: IForumState = {
    delete: {
        isLoading: false,
        isSuccess: false,
        error: null,
    },
};

const deleteForumSlice = createSlice({
    name: 'forumDelete',
    initialState,
    reducers: {
        resetDeleteState: state => {
            state.delete = initialState.delete;
        },
    },
    extraReducers: builder => {
        // Delete role cases
        builder
            .addCase(deleteForum.pending, state => {
                state.delete.isLoading = true;
                state.delete.isSuccess = false;
                state.delete.error = null;
            })
            .addCase(deleteForum.fulfilled, (state, action: PayloadAction<boolean>) => {
                state.delete.isLoading = false;
                state.delete.isSuccess = action.payload;
                state.delete.error = null;
            })
            .addCase(deleteForum.rejected, (state, action) => {
                state.delete.isLoading = false;
                state.delete.isSuccess = false;
                state.delete.error = action.payload as string;
            });
    },
});

export const { resetDeleteState } = deleteForumSlice.actions;
export default deleteForumSlice.reducer;
