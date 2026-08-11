import { createAsyncThunk } from '@reduxjs/toolkit';
import { deleteAPI } from '../../services/api';
import type { IDeleteForum } from '../../types/request';

export const deleteForum = createAsyncThunk(
    'roles/deleteRole',
    async (request: IDeleteForum, { rejectWithValue }) => {
        try {
            const response = await deleteAPI(`api/forum/forum?forumId=${request.forumId}`, {});
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response.data || 'An error occurred');
        }
    },
);
