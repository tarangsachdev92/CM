import { createSlice } from '@reduxjs/toolkit';
import { fetchToDosFlyout } from '../thunks/fetchToDosFlyout';
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
            .addCase(fetchToDosFlyout.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchToDosFlyout.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchToDosFlyout.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Something went wrong';
            });
    },
});

export default todoSlice.reducer;
