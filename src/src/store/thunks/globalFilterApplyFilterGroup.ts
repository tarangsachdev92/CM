import { createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI } from '../../services/api';
import type { FilterGroupRequest } from '../../types/request';

export const ApplyFilterGroup = createAsyncThunk(
    'globalfilter/ApplyFilterGroup',
    async (request: FilterGroupRequest, { rejectWithValue }) => {
        try {
            const response = await postAPI('/api/globalFilter/apply-filter-group', request);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response.data || 'An error occurred');
        }
    },
);
