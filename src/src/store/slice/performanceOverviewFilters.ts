import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    fetchPerformanceOverviewFilters,
    IPerformanceOverviewFilters,
} from '../thunks/performanceManagementWidgets';

interface PerformanceManagementWidgetsState {
    performanceOverviewFilters: IPerformanceOverviewFilters[];

    isFetching: boolean;
    isSearching: boolean;
    isSaving: boolean;

    error: string | null;
}

const initialState: PerformanceManagementWidgetsState = {
    performanceOverviewFilters: [],
    isFetching: false,
    isSearching: false,
    isSaving: false,
    error: null,
};

const performanceOverviewFilterSlice = createSlice({
    name: 'performanceManagementWidgets',
    initialState,
    reducers: {
        clearSearchResults: state => {
            state.performanceOverviewFilters = [];
            state.error = null;
            state.isSearching = false;
        },
    },
    extraReducers(builder) {
        builder.addCase(fetchPerformanceOverviewFilters.pending, state => {
            state.isFetching = true;
            state.error = null;
        });
        builder.addCase(
            fetchPerformanceOverviewFilters.fulfilled,
            (state, action: PayloadAction<IPerformanceOverviewFilters[]>) => {
                state.isFetching = false;
                state.performanceOverviewFilters = action.payload;
                state.error = null;
            },
        );
        builder.addCase(fetchPerformanceOverviewFilters.rejected, (state, action) => {
            state.isFetching = false;
            state.error = action.payload as string;
        });
    },
});

export const { clearSearchResults } = performanceOverviewFilterSlice.actions;
export default performanceOverviewFilterSlice.reducer;
