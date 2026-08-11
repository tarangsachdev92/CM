import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAPI } from '../../services/api';

export const forumPeriod = createAsyncThunk('forum/forumPeriod', async () => {
    const response = await getAPI('/api/forum/forum-period');
    return response.data.data;
});
