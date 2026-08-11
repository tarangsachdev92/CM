import { createSlice } from '@reduxjs/toolkit';
import { saveForumV1 } from '../thunks/addNewForums';

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

const addNewForumsSlice = createSlice({
    name: 'addNewForums',
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
            .addCase(saveForumV1.pending, state => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })

            .addCase(saveForumV1.fulfilled, (state, action) => {
                console.log('PAYLOADHello:', action.payload);
                state.loading = false;

                if (action.payload?.statusCode === 200) {
                    state.success = true;
                }
            })

            .addCase(saveForumV1.rejected, (state, action) => {
                state.loading = false;
                state.success = false;
                state.error = (action.payload as string) || 'Failed to save forum';
            });
    },
});

export const { resetForumState } = addNewForumsSlice.actions;
export default addNewForumsSlice.reducer;
