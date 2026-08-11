import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

export const forumLevel = createAsyncThunk('forum/forumLevel', async () => {
    const response = await getAPI('/api/forum/forum-level');
    return response.data.data;
});
