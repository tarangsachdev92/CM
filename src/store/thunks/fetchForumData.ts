import { createAsyncThunk } from '@reduxjs/toolkit';
import type { IRoleRequest } from '../../types/request';
import { postAPI } from '../../services/api';

export const fetchForumData = createAsyncThunk(
    'forumData/fetchForumData',
    async (request: IRoleRequest, { rejectWithValue }) => {
        try {
            const response = await postAPI('api/forums/forum-details', request);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'An error occurred');
        }
    },
);
