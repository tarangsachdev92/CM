import { createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI } from '../../services/api';
import { IMyFavouriteItem } from '../../types/request';

interface FetchFavouritesPayload {
    objectType: string | null;
    objectName: string | null;
}

interface FetchFavouritesResponse {
    favouriteItems: IMyFavouriteItem[];
    favouriteCount: {
        totalAppFavourites: number;
        totalReportFavourites: number;
    };
}

export const fetchMyFavourites = createAsyncThunk<FetchFavouritesResponse, FetchFavouritesPayload>(
    'favourites/fetchMyFavourites',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await postAPI('api/appReport/get-my-favourites', payload);
            return {
                favouriteItems: response.data.data.appReportDetails,
                favouriteCount: response.data.data.favouriteCount,
            };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch favourites');
        }
    },
);
