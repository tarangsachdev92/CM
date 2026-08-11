import { createSlice, SerializedError } from '@reduxjs/toolkit';
import { fetchAppAndReportsSearchResults } from '../thunks/fetchAppAndReportsSearchResults';

const initialState = {
    data: [],
    loading: false,
    error: null as SerializedError | null,
};

const searchAppAndReportsSlice = createSlice({
    name: 'searchAppAndReportsSlice',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchAppAndReportsSearchResults.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAppAndReportsSearchResults.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchAppAndReportsSearchResults.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error as SerializedError;
            });
    },
});

export default searchAppAndReportsSlice.reducer;
