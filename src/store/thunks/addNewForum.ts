import { createAsyncThunk } from '@reduxjs/toolkit';
import { postAPI, putAPI } from '../../services/api';
import type { IAddForumRequest } from '../../types/request';

export const addNewForum = createAsyncThunk(
    'forum/addNewForum',
    async (request: IAddForumRequest, { rejectWithValue }) => {
        try {
            const response = await postAPI('api/forum/add-forum-details', request);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response.data || 'An error occurred');
        }
    },
);

export const editForumDetails = createAsyncThunk(
    'forum/editForumDetails',
    async (request: IAddForumRequest, { rejectWithValue }) => {
        try {
            const response = await putAPI('/api/forum/update-forum-details', request);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response.data || 'An error occurred');
        }
    },
);
