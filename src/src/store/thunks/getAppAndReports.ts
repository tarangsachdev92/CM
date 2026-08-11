import { createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI } from '../../services/api';
import { IAppSReportItem } from '../../types/request';

interface getAppAndReports {
    objectType: string | null;
    objectName: string | null;
    pageNumber: number;
    pageSize: number;
    regionId: string | null;
    functionId: string | null;
    subFunctionId: string | null;
    isFavourite: number | null;
}

export const getAppAndReports = createAsyncThunk<IAppSReportItem[], getAppAndReports>(
    'recentlyOpened/getAppAndReports',
    async (payload, { rejectWithValue }) => {
        try {
            const response = await postAPI('api/appReport/get-AppReport-Details', payload);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch recently opened items');
        }
    },
);

export const getAppAndReportsFavourite = createAsyncThunk(
    'appReports/updateFavourite',
    async (
        payload: { objectId: number; objectType: string; isFavourite: boolean },
        { rejectWithValue },
    ) => {
        try {
            const response = await postAPI('api/appReport/update-my-favourites', payload);
            return response.data.data;
        } catch {
            return rejectWithValue('Failed to update favourite status');
        }
    },
);
