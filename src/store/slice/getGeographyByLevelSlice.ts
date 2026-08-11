import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getGeographyByLevel } from '../thunks/getGeographyByLevel';

interface GeographyByLevelState {
    data: any[];
    loading: boolean;
    error: string | null;
}

const initialState: GeographyByLevelState = {
    data: [],
    loading: false,
    error: null,
};

const getGeographyByLevelSlice = createSlice({
    name: 'geographyByLevel',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(getGeographyByLevel.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getGeographyByLevel.fulfilled, (state, action: PayloadAction<any[]>) => {
                state.loading = false;
                state.data = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(getGeographyByLevel.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch geography by level';
            });
    },
});

export default getGeographyByLevelSlice.reducer;
