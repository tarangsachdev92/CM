import { createSlice } from '@reduxjs/toolkit';
import { fetchMyFavourites } from '../thunks/fetchMyFavourites';
import { IMyFavouriteItem } from '../../types/request';

interface MyFavouritesState {
    data: {
        favouriteItems: IMyFavouriteItem[];
        favouriteCount: {
            totalAppFavourites: number;
            totalReportFavourites: number;
        };
    };
    loading: boolean;
    error: string | null;
}

const initialState: MyFavouritesState = {
    data: {
        favouriteItems: [],
        favouriteCount: {
            totalAppFavourites: 0,
            totalReportFavourites: 0,
        },
    },
    loading: false,
    error: null,
};

const myFavouritesAppsAndReportsSlice = createSlice({
    name: 'favourites',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchMyFavourites.pending, state => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyFavourites.fulfilled, (state, action) => {
                state.loading = false;
                state.data.favouriteItems = Array.isArray(action.payload.favouriteItems)
                    ? action.payload.favouriteItems
                    : [];
                state.data.favouriteCount = action.payload.favouriteCount ?? {
                    totalAppFavourites: 0,
                    totalReportFavourites: 0,
                };
            })
            .addCase(fetchMyFavourites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default myFavouritesAppsAndReportsSlice.reducer;
