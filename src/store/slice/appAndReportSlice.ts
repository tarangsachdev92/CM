import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getAppAndReports, getAppAndReportsFavourite } from '../thunks/getAppAndReports';
import { IAppSReportItem } from '../../types/request';

interface AppReportsState {
    data: IAppSReportItem[];
    loading: boolean;
    error: string | null;
    favouritesUpdated: boolean;
}

const initialState: AppReportsState = {
    data: [],
    loading: false,
    error: null,
    favouritesUpdated: false,
};

const appReportsSlice = createSlice({
    name: 'appReports',
    initialState,
    reducers: {
        setAppReports(state, action: PayloadAction<IAppSReportItem[]>) {
            state.data = action.payload;
        },
        updateFavouriteLocally(
            state,
            action: PayloadAction<{ objectId: number; isFavourite: boolean }>,
        ) {
            const { objectId, isFavourite } = action.payload;
            const item = state.data.find(report => report.objectId === objectId);
            if (item) {
                item.isFavourite = isFavourite;
            }
        },
        setFavouritesUpdated(state, action: PayloadAction<boolean>) {
            state.favouritesUpdated = action.payload;
        },
        clearFavouritesUpdated(state) {
            state.favouritesUpdated = false;
        },
    },
    extraReducers: builder => {
        builder
            .addCase(getAppAndReports.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAppAndReports.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(getAppAndReports.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(getAppAndReportsFavourite.fulfilled, (state, action) => {
                if (!action.payload) return;
                const { objectId, isFavourite } = action.payload;
                const item = state.data.find(report => report.objectId === objectId);
                if (item) {
                    item.isFavourite = isFavourite;
                }
            });
    },
});

export const { setAppReports, updateFavouriteLocally, setFavouritesUpdated,clearFavouritesUpdated, } = appReportsSlice.actions;
export default appReportsSlice.reducer;
