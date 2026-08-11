import { createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI } from '../../services/api';
import type { ITagsRequest } from '../../types/request';

export const getTagDetails = createAsyncThunk(
    'tags/getTagDetails',
    async (request: ITagsRequest, { rejectWithValue }) => {
        try {
            const response = await postAPI('/api/tag/tag-details', request);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response.data || 'An error occurred');
        }
    },
);
