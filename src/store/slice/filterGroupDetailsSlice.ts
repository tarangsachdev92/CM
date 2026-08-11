import { createSlice, SerializedError } from '@reduxjs/toolkit';
import {
    fetchFilterGroupDetails,
    fetchFilterHierarchies,
    fetchFilterFinancialCycle,
} from '../thunks/fetchFilterGroupDetails';
import { FilterGroupDataModel } from '../../types/request';
import { IFilterHierarchiesData, IFilterFinancialCycle } from '../../types/response';

interface FilterGroupState {
    data: FilterGroupDataModel[];
    hierarchies: IFilterHierarchiesData[];
    financialCycle: IFilterFinancialCycle[];
    loading: boolean;
    error: SerializedError | null;
}

const initialState: FilterGroupState = {
    data: [],
    hierarchies: [],
    financialCycle: [],
    loading: false,
    error: null,
};

const filterGroupDetailsSlice = createSlice({
    name: 'filterGroupDetails',
    initialState,
    reducers: {},
    extraReducers: builder => {
        // Handle fetchFilterGroupDetails
        builder
            .addCase(fetchFilterGroupDetails.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFilterGroupDetails.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchFilterGroupDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error;
            });

        // Handle fetchFilterHierarchies
        builder
            .addCase(fetchFilterHierarchies.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFilterHierarchies.fulfilled, (state, action) => {
                state.loading = false;
                state.hierarchies = action.payload as IFilterHierarchiesData[];
            })
            .addCase(fetchFilterHierarchies.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error;
            });

        builder
            .addCase(fetchFilterFinancialCycle.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFilterFinancialCycle.fulfilled, (state, action) => {
                state.loading = false;
                state.financialCycle = action.payload as IFilterFinancialCycle[];
            })
            .addCase(fetchFilterFinancialCycle.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error;
            });
    },
});

export default filterGroupDetailsSlice.reducer;
