import { createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI } from '../../services/api';
import { IAddForumsRequest } from '../../types/request';

export const editForum = createAsyncThunk(
    'forum/editForum',
    async (request: IAddForumsRequest, { rejectWithValue }) => {
        try {
            const response = await postAPI('/api/forum/edit-forum-basic-and-geographic-detail', request);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to update forum');
        }
    },
);
