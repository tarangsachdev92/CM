import { createSlice } from '@reduxjs/toolkit';
import { fetchToDos } from '../thunks/fetchToDos';
import { IToDoDetails } from '../../types/response';

interface IToDoState {
    data: IToDoDetails[];
    loading: boolean;
    error: string | null;
}

const initialState: IToDoState = {
    data: [],
    loading: false,
    error: null,
};

const todoSlice = createSlice({
    name: 'todoData',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchToDos.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchToDos.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchToDos.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Something went wrong';
            });
    },
});

export default todoSlice.reducer;
