import { createSlice } from '@reduxjs/toolkit';
import { getToDoComments } from '../thunks/getToDoComments';
import type { ToDoComments } from '../../types/response';

interface todoCommentsState {
    data: ToDoComments[];
    loading: boolean;
    error: string | null;
}

const initialState: todoCommentsState = {
    data: [],
    loading: false,
    error: null,
};

const todoCommentsSlice = createSlice({
    name: 'todoCommentsDetails',
    initialState,
    reducers: {
        todoCommentsState: state => {
            state.data = [];
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getToDoComments.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getToDoComments.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(getToDoComments.rejected, (state, action) => {
                state.loading = false;
                state.error = (action.payload as string) ?? 'Failed to fetch opportunity issues';
            });
    },
});

export const { todoCommentsState } = todoCommentsSlice.actions;
export default todoCommentsSlice.reducer;
