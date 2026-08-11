import { createAsyncThunk } from '@reduxjs/toolkit';
import { getForumPersonaMappings } from '../../services/forums';

export const fetchForumPersonaMappings = createAsyncThunk(
    'forum/fetchForumPersonaMappings',
    async (payload: { toolId: number }, { rejectWithValue }) => {
        try {
            const data = await getForumPersonaMappings(payload);
            return data;
        } catch (error: any) {
            return rejectWithValue(error?.response?.data || 'An error occurred');
        }
    },
);
