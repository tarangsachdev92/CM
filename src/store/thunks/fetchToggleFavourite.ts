import { createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI } from '../../services/api';
import { IFavouriteItem } from '../../types/request';

interface fetchToggleFavourite {
    objectId: string | null;
    objectType: string | null;
    isFavourite: boolean;
}

export const fetchToggleFavourite = createAsyncThunk<IFavouriteItem[], fetchToggleFavourite>(
    'recentlyOpened/fetchToggleFavourite',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await postAPI('api/appReport/update-my-favourites', payload);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch recently opened items');
        }
    },
);
