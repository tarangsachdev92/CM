import { createSlice, SerializedError } from '@reduxjs/toolkit';
import { fetchImpactAnalysisTableData } from '../thunks/fetchImpactAnalysisTableData';

const initialState = {
    tableData: {
        impactAnalysisOTIFD: [],
        impactAnalysisRC: [],
    },
    loading: false,
    error: null as SerializedError | null,
};

const impactAnalysisTableDataSlice = createSlice({
    name: 'impactAnalysisTableDataSlice',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchImpactAnalysisTableData.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchImpactAnalysisTableData.fulfilled, (state, action) => {
                state.loading = false;
                state.tableData = {
                    impactAnalysisOTIFD: action.payload.impactAnalysisOTIFD || [],
                    impactAnalysisRC: action.payload.impactAnalysisRC || [],
                };
            })
            .addCase(fetchImpactAnalysisTableData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error as SerializedError;
            });
    },
});

export default impactAnalysisTableDataSlice.reducer;
