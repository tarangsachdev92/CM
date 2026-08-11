
import { createSlice } from '@reduxjs/toolkit';
import {
    fetchRecentlyOpenedAppsAndReports,
    addRecentlyOpenedAppsAndReports,
} from '../thunks/fetchRecentlyOpenedAppsAndReports';
import { IRecentlyOpenedItem } from '../../types/request';

interface RecentlyOpenedState {
    data: IRecentlyOpenedItem[];
    loading: boolean;
    error: string | null;
}

const initialState: RecentlyOpenedState = {
    data: [],
    loading: false,
    error: null,
};

const recentlyOpenedAppsAndReportsSlice = createSlice({
    name: 'recentlyOpened',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchRecentlyOpenedAppsAndReports.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchRecentlyOpenedAppsAndReports.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchRecentlyOpenedAppsAndReports.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? 'Unknown error';
            })
            .addCase(addRecentlyOpenedAppsAndReports.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addRecentlyOpenedAppsAndReports.fulfilled, state => {
                state.loading = false;
            })
            .addCase(addRecentlyOpenedAppsAndReports.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? 'Unknown error';
            });
    },
});

export default recentlyOpenedAppsAndReportsSlice.reducer;