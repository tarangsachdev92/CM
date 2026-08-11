import { createSlice, SerializedError } from '@reduxjs/toolkit';
import { fetchBasicKpiCard } from '../thunks/fetchBasicKpiCard';

const initialState = {
    appName: [],
    loading: false,
    error: null as SerializedError | null,
};

const basicKpicardSlice = createSlice({
    name: 'basicKpicardSlice',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchBasicKpiCard.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBasicKpiCard.fulfilled, (state, action) => {
                state.loading = false;
                state.appName = action.payload;
            })
            .addCase(fetchBasicKpiCard.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error as SerializedError;
            });
    },
});

export default basicKpicardSlice.reducer;
