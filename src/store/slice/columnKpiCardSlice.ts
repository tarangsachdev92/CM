import { createSlice, SerializedError } from '@reduxjs/toolkit';
import { fetchColumnKpiCard } from '../thunks/fetchColumnKpiCard';

const initialState = {
    columnData: [],
    loading: false,
    error: null as SerializedError | null,
};

const columnKpiCardSlice = createSlice({
    name: 'columnKpiCardSlice',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchColumnKpiCard.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchColumnKpiCard.fulfilled, (state, action) => {
                state.loading = false;
                state.columnData = action.payload;
            })
            .addCase(fetchColumnKpiCard.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error as SerializedError;
            });
    },
});

export default columnKpiCardSlice.reducer;
