import { createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI } from '../../services/api';
import { IAddForumsRequest } from '../../types/request';

export const saveForumV1 = createAsyncThunk(
    'forum/saveForumV1',
    async (request: IAddForumsRequest, { rejectWithValue }) => {
        try {
            const response = await postAPI('api/forum/save-forum-v1', request);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to save forum');
        }
    },
);


export const editForumV1 = createAsyncThunk(
    'forum/editForumV1',
    async (request: IAddForumsRequest, { rejectWithValue }) => {
        try {
            const response = await postAPI('api/forum/edit-forum-basic-and-geographic-detail', request);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to save forum');
        }
    },
);

