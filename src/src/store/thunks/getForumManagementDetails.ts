import { createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI } from '../../services/api';
import type { IGetForumDetailsRequest } from '../../types/request';

export const getForumManagementDetails = createAsyncThunk(
    'forum/getForumDetails',
    async (request: IGetForumDetailsRequest, { rejectWithValue }) => {
        try {
            const response = await postAPI('api/forum/get-forumManagement-details', request);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(error.response.data || 'An error occurred');
        }
    },
);